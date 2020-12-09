var express = require('express');
var app = express();
var path = require('path');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var usersql = require('./usersql.js');
var session = require('express-session');
var fs = require('fs');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('view engine','ejs');
app.set('views','./views');
////////////////////////////////////////////////////////////////////////
/* Socket Setting */
var userCount = 0;
var sockets = [];
var users = [];
var UsrRoom = [];
io.on('connection',function(socket){
    console.log('user connected: ',socket.id);
    socket.on('disconnect',function(){
        console.log('user disconnected: ',socket.id);
        var index = sockets.indexOf(socket.id);
        var state = users[index];
        if(UsrRoom[index]=='Hello')
        {
            userCount -= 1;
            if(typeof(state)!="undefined" && state.indexOf("(m)")==-1)
            {
                io.emit('receive message',("시스템|"+users[index]+"님이 나갔습니다."));
            }
            users.splice(index,1);
            sockets.splice(index,1);
            UsrRoom.splice(index,1);
            io.sockets.in('Hello').emit('userCount',userCount);
            io.sockets.in('Hello').emit('RefreshUser',users);
            socket.leave('Hello');
        }
        else
        {
            io.emit('disAll',socket.id); // 만약 방장이면 방 삭제
            io.emit('roomout',socket.id);
        }
    });
    ///////////////////////////////////////////////////////////////////
    /* Main Room Emit */
    socket.on('joinSVRoom',function(roomId){
        socket.join(roomId);
        userCount += 1;
        io.sockets.in('Hello').emit('userCount',userCount);
    });
    socket.on('send message',function(name,text){
        if(text!="")
        {
            var msg = name + '|' + text;
            io.sockets.in('Hello').emit('receive message',msg);
        }
    });
    socket.on('OnUser',function(onUser){
        var multi;
        for(var k=0;k<users.length;k++)// 중복 유저 체크
        {
            if(users[k]==onUser)
            {
                multi = onUser + "(m)";
            }
        }
        if(multi)
        {
            sockets.push(socket.id);
            users.push(multi);
            UsrRoom.push(Object.keys(io.sockets.adapter.sids[socket.id])[1]);
            io.to(socket.id).emit('multiout');
            socket.disconnect();
            return;
        }
        sockets.push(socket.id);
        users.push(onUser);
        UsrRoom.push(Object.keys(io.sockets.adapter.sids[socket.id])[1]);
        io.sockets.in('Hello').emit('receive message',("시스템|"+onUser+"님이 접속하셨습니다."));
        io.sockets.in('Hello').emit('RefreshUser',users);
        io.sockets.in('Hello').emit('RoomRefresh');
    });
    socket.on('broadcastRoom',function(){
        io.sockets.in('Hello').emit('RoomRefresh');
    });
    ////////////////////////////////////////////////////////////////////
    /* Game Room Emit */
    socket.on('joinRoom',function(roomId){
        socket.join(roomId);
        io.sockets.in(roomId).emit('RefreshPP');
        usersql.onlineplus(roomId,function(err){
            if(err)throw err;
        });
        io.emit('RoomRefresh');
    });
    socket.on('send message2',function(name,text,roomId){
        if(text!="")
        {
            var msg = name + '|' + text;
            io.sockets.in(roomId).emit('receive message2',msg);
        }
    });
    socket.on('OnUser2',function(onUser,roomId){
        io.sockets.in(roomId).emit('receive message2',("시스템|"+onUser+"님이 접속하셨습니다."));
    });
    socket.on('plusUser',function(name,printU,roomId){
        io.sockets.in(roomId).emit('add',name,socket.id,printU);
    });
    socket.on('sendUS',function(users,soc,printU,stateR,roomId){
      io.sockets.in(roomId).emit('refreshUS',users,soc,printU,stateR);
    });

    socket.on('bye',function(roomId){
        usersql.deleteRoom(roomId,function(err){
            if(err)throw err;
        });
        io.emit('RoomRefresh');
    });
    socket.on('sqlRe',function(roomId){
        usersql.onlineminus(roomId,function(err){
            if(err)throw err;
        });
        io.sockets.in(roomId).emit('RefreshPP');
    });
    socket.on('readycomp',function(name,roomId,state){
        io.sockets.in(roomId).emit('readyplus',name,state);
    });
    socket.on('refreshRD',function(stateR,roomId){
        io.sockets.in(roomId).emit('RDrefresh',stateR);
    });
    socket.on('userout',function(name,roomId){
        io.sockets.in(roomId).emit('Uout',name);
    });
    socket.on('CancelST',function(roomId){
        socket.broadcast.to(roomId).emit('CanceledST');
    });
    socket.on('setProblem',function(roomId){
        var x = Math.floor(Math.random() * 50) + 1;
        var y = Math.floor(Math.random() * 50) + 1;
        var re = x*y*43;
        io.sockets.in(roomId).emit('getProblem',x,y,re);
    });
    socket.on('setAns',function(ans,re,name,roomId){
        if((re/43)==ans)
        {
            io.sockets.in(roomId).emit('settingGame',name,1);
        }
        else
        {
            io.sockets.in(roomId).emit('settingGame',name,0);
        }
    });
    socket.on('shuffleCards',function(roomId){
        var cardlist = ["b1","b2","b3","b4","b5","g1","g2","g3","g4","g5","i1","i2","i3","i4","i5","o1","o2","o3","o4","o5","w1","w2","w3","w4","w5","d1","d2","d3","d4","d5"];
        var u1 = [];
        var u2 = [];
        for(var i=0;i<30;i++)
        {
            var r = Math.floor(Math.random() * 30);
            var tmp = cardlist[r];
            cardlist[r] = cardlist[0];
            cardlist[0] = tmp;
        }
        for(var i=0;i<15;i++)
        {
            u1.push(cardlist[0]);
            cardlist.splice(0,1);
        }
        for(var i=0;i<15;i++)
        {
            u2.push(cardlist[0]);
            cardlist.splice(0,1);
        }
        io.sockets.in(roomId).emit('compshuffle',u1,u2);
    });
    socket.on('cardClick',function(name,selected,roomId){
        io.sockets.in(roomId).emit('nextTurn',name,selected);
    });
    socket.on('myfirstbell',function(name,ck,roomId){
        io.sockets.in(roomId).emit('cardLoseOrGet',name,ck);
    });
    socket.on('mycardlength',function(mcl,roomId){
        socket.broadcast.to(roomId).emit('setCardlength',mcl);
    });
    socket.on('givemycard',function(gc,roomId){
        socket.broadcast.to(roomId).emit('getgivecard',gc);
    });
});
///////////////////////////////////////////////////////////////////////


http.listen(3000, function() {
    console.log("Server Start!");
    usersql.DeleteAllRoom(function(err){
        if(err){throw err;}
    });
    usersql.RoomAIR(function(err){
        if(err){throw err;}
    });
  });
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
    key: 'sid',
    secret:'secret',
    resave:false,
    saveUninitialized:true
}));
app.use(express.static('public'));
app.get('/', function(req, res) {
    var session = req.session;
    if(req.session.user)
    {
        usersql.userinfo(req.session.user,function(err,result){
            usersql.getfiveboard("board_notice",function(err,notice){
                if(err)throw err;
                usersql.getfiveboard("board_free",function(err,free){
                    if(err)throw err;
                    usersql.getfiveboard("board_bt",function(err,bt){
                        if(err)throw err;
                        res.render('main',{session:session,point:result[0]['point'],win:result[0]['win'],draw:result[0]['draw'],lose:result[0]['lose'],notice:notice,free:free,bt:bt});
                    });
                });
            });
        });
    }
    else
    {
        usersql.userinfo(req.session.user,function(err,result){
            usersql.getfiveboard("board_notice",function(err,notice){
                if(err)throw err;
                usersql.getfiveboard("board_free",function(err,free){
                    if(err)throw err;
                    usersql.getfiveboard("board_bt",function(err,bt){
                        if(err)throw err;
                        res.render('main',{session:session,notice:notice,free:free,bt:bt});
                    });
                });
            });
        });
    }
});

app.get('/join',function(req,res){
        res.render('join',{});
});

app.get('/joinNext',function(req,res){
        res.render('joinNext',{});
});

app.post('/joinComplete',function(req,res){
    var id = req.body.u_id;
    var pw = req.body.u_pw;
    var nick = req.body.u_nick;

    usersql.register(nick,id,pw,function(err){
        if(err) throw err;
    })
    res.redirect('/');
});

app.get('/checkNick/:nick',function(req,res){
    var nick = req.params.nick;
    usersql.FindNick(nick,function(err,result){
        if(err)throw err;
        var i = 0;
        for(var key in result){
            ++i;
        }
        if(i!=0)
        {
            res.send(result[0]['name']);
        }
        else
        {
            res.send(null);
        }
    })
})

app.get('/checkId/:id',function(req,res){
    var id = req.params.id;
    usersql.FindId(id,function(err,result){
        if(err)throw err;
        var i = 0;
        for(var key in result){
            ++i;
        }
        if(i!=0)
        {
            res.send(result[0]['id']);
        }
        else
        {
            res.send(null);
        }
    })
})

app.post('/login',function(req,res){
    var id = req.body.u_id;
    var pw = req.body.u_pw;
    usersql.login(id,function(err,result){
        if(err) throw err;
        var i = 0;
        for(var key in result){
            i++;
        }
        if(i==0)
        {
            console.log("로그인 실패...");
            res.redirect('/');
        }
        else
        {
            if(id==result[0]['id'] && pw==result[0]['pw'])
            {
                console.log(result[0]['name']+"님이 로그인하셨습니다.");
                req.session.user = result[0]['name'];
                res.redirect('/');
            }
            else
            {
                console.log("로그인 실패...");
                res.redirect('/');
            }
        }
    });
});
app.get('/logout',function(req,res){
    req.session.destroy();
    res.clearCookie('sid');
    res.redirect('/');
});
app.get('/write/:board',function(req,res){
    var board = req.params.board;
    if(req.session.user)
    {
        if(board=="board_free" || board=="board_bt" || board=="board_notice")
        {
            if(board=="board_notice" || board=="board_event")
            {
                if(req.session.user == "관리자")
                {
                    res.render('write',{num:0,result:{},id:board,session:req.session});
                }
                else
                {
                    res.redirect('/');
                }
            }
            else
            {
                res.render('write',{num:0,result:{},id:board,session:req.session});
            }
        }
        else
        {
            res.redirect('/');
        }
    }
    else
    {
        res.redirect('/');
    }
});

app.get('/write/:board/:id',function(req,res){
    var board = req.params.board;
    var id = req.params.id;
    if(req.session.user)
    {
        if(board=="board_free" || board=="board_bt" || board=="board_notice")
        {
            if(board=="board_notice" || board=="board_event")
            {
                if(req.session.user == "관리자")
                {
                    res.render('write',{id:board,session:req.session});
                }
                else
                {
                    res.redirect('/');
                }
            }
            else
            {
              usersql.showWrite(board,id,function(err,result){
                  if(err)throw err;
                  var i = 0;
                  for(var i in result)
                  {
                      i++;
                  }
                  if(i!=0)
                  {
                      res.render('write',{num:id,id:board,result:result,session:req.session});
                  }
                  else
                  {
                      res.redirect('/');
                  }
              });
            }
        }
        else
        {
            res.redirect('/');
        }
    }
    else
    {
        res.redirect('/');
    }
});

app.get('/board_free',function(req,res){
    usersql.boardCheck("board_free",function(err,result){
        var i = 0;
        for(var i in result)
        {
            i++;
        }
        if(i!=0)
        {
            res.render('freeboard',{session:req.session,id:"board_free",board:result});
        }
        else
        {
            res.render('freeboard',{session:req.session,id:"board_free",board:null});
        }
    });
})

app.get('/board_bt',function(req,res){
    usersql.boardCheck("board_bt",function(err,result){
        var i = 0;
        for(var i in result)
        {
            i++;
        }
        if(i!=0)
        {
            res.render('btboard',{session:req.session,id:"board_bt",board:result});
        }
        else
        {
            res.render('btboard',{session:req.session,id:"board_bt",board:null});
        }
    });
})

app.get('/board_notice',function(req,res){
    usersql.boardCheck("board_notice",function(err,result){
        var i = 0;
        for(var i in result)
        {
            i++;
        }
        if(i!=0)
        {
            res.render('noticeboard',{session:req.session,id:"board_notice",board:result});
        }
        else
        {
            res.render('noticeboard',{session:req.session,id:"board_notice",board:null});
        }
    });
})

app.get('/show/:board/:id',function(req,res){
    var id = req.params.id;
    var board = req.params.board;
    usersql.upBoard(board,id,function(err,result){
        if(err)throw err;
    });
    usersql.showWrite(board,id,function(err,result){
        if(err)throw err;
        var i = 0;
        for(var i in result)
        {
            i++;
        }
        if(i!=0)
        {
            res.render('show',{num:id,id:board,result:result,board:board,session:req.session});
        }
        else
        {
            res.redirect('/');
        }
    });
})
app.post('/SendToMe',function(req,res){
    var id = req.body.id;
    var title = req.body.title;
    var contents = req.body.contents;
    var name = req.body.name;
    usersql.boardWrite(id,title,contents,name,function(err,result){
        if(err)throw err;
    });
});

app.post('/SendToMeEdit',function(req,res){
    var id = req.body.id;
    var title = req.body.title;
    var contents = req.body.contents;
    var num = req.body.num;

    usersql.boardUpdate(id,title,contents,num,function(err,result){
        if(err)throw err;
    });
});

app.get('/deleteW/:board/:num',function(req,res){
  //req.session.user == "관리자"
  var board = req.params.board;
  var num = req.params.num;
  usersql.findNickWrite(board,num,function(err,result){
      if(err)throw err;
      if(req.session.user == result[0]['name']){
        usersql.deleteWrite(board,num,function(err){
            if(err)throw err;
        });
      }
  });
  res.redirect('/'+board);
});

app.get('/room',function(req,res){
    if(req.session.user)
    {
        usersql.ranking(function(err,result){
            if(err) throw err;
            usersql.userinfo(req.session.user,function(err,myresult){
                if(err) throw err;
                usersql.playgame(function(err,board){
                    if(err) throw err;
                    res.render('room',{session:req.session,rank:result,myresult:myresult,board:board});
                });
            });
        });
    }
    else
    {
        res.render('room',{session:req.session});
    }
});

app.get('/ranking',function(req,res){
    usersql.ranking(function(err,result){
        if(err) throw err;
        res.render('ranking',{rank:result});
    });
});


app.get('/onlinechk/:id',function(req,res){
    var id = req.params.id;
    usersql.onlinecheck(id,function(err,onuser){
        if(err) throw err;
        if(onuser[0]['online']==1)
        {
            res.send({result:"1"});
        }
        else if(onuser[0]['online']==2)
        {
            res.send({result:"2"});
        }
        else
        {
            res.send({result:"0"});
        }
    });
});

app.get('/RefreshRoom',function(req,res){
    usersql.playgame(function(err,board){
        if(err){throw err;}
        res.send(board);
    });
});

app.post('/CreateRoom',function(req,res){
    var title = req.body.title;
    var player = req.body.player;
    var creator = req.body.creator;
    var online = req.body.online;
    if(title!="")
    {
        usersql.CreateRoom(title,creator,player,online,function(err,result){
            if(err){throw err;}
        });
    }
});

app.get('/readyRoom/:id',function(req,res){
    var id = req.params.id;
    if(req.session.user)
    {
        usersql.userinfo(req.session.user,function(err,myresult){
            if(err) throw err;
            usersql.roomInfo(id,function(err,nor){
                if(err)throw err;
                var i = 0;
                for(var key in nor){
                    i++;
                }
                if(i==0 || nor[0]['full']==1)
                {
                    res.redirect('/');
                }
                else
                {
                    usersql.onlinecheck(id,function(err,onuser){
                        if(err)throw err;
                        if(onuser[0]['online']==0)
                        {
                            res.render('readyRoom',{session:req.session,myresult:myresult,id:id,Roominfo:nor,Maker:1});
                        }
                        else if(onuser[0]['online']==1)
                        {
                            usersql.changeFull(id,function(err){
                                if(err)throw err;
                            });
                            res.render('readyRoom',{session:req.session,myresult:myresult,id:id,Roominfo:nor,Maker:0});
                        }
                    });
                }
            });
        });
    }
    else
    {
        res.redirect('/');
    }
});

app.get('/checkRoom/:nick',function(req,res){
    var nick = req.params.nick;
    usersql.findRoom(nick,function(err,result){
        res.send(result);
    });
});

app.get('/deleteRoom/:id',function(req,res){
    var id = req.params.id;
    usersql.roomCheck(id,function(err,result){
        if(err) throw err;
        if(result[0]['online']==0)
        {
          usersql.deleteRoom(id,function(err){
              if(err)
              {
                console.log("삭제 오류");
              }

          });
        }

    });
});

app.get('/getRoomPP/:id',function(req,res){
    var id = req.params.id;
    usersql.roomInfo(id,function(err,result){
        if(err){throw err;}
        res.send(result[0]);
    });
});

app.get('/printuser/:id',function(req,res){
    var id = req.params.id;
    usersql.userinfo(id,function(err,result){
        if(err)throw err;
        res.send(result[0]);
    });
});

app.get('/winner/:nick',function(req,res){
    var nick = req.params.nick;
    usersql.winpoint(nick,function(err,result){
        if(err)throw err;
    });
});

app.get('/loser/:nick',function(req,res){
    var nick = req.params.nick;
    usersql.losepoint(nick,function(err,result){
        if(err)throw err;
    });
});

app.get('/store',function(req,res){
  res.render('store',{session:req.session});

});

app.get('/pointcheck',function(req,res){
  usersql.userinfo(req.session.user,function(err,result){
      if(err)throw err;
      if(parseInt(result[0]["point"])>=100){
        res.send(true);
      }else{
        res.send(false);
      }
  });
});

app.get('/changenick/:id',function(req,res){
    var id = req.params.id;
    usersql.userinfo(req.session.user,function(err,result){
      if(err)throw err;
        var point = parseInt(result[0]["point"]);
        if(point>=100){
            usersql.changePoint(req.session.user,function(err,result){
              if(err)throw err;
              usersql.changeNick(req.session.user, id, function(err,result){
                if(err)throw err;

              });
            });
        }else{
          console.log("변경 실패");
        }
    });
    res.redirect('/logout');
});
