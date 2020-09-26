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
http.listen(3000, function() {
    console.log("Server Start!");
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
                    res.render('write',{id:board,session:req.session});
                }
                else
                {
                    res.redirect('/');
                }
            }
            else
            {
                res.render('write',{id:board,session:req.session});
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
            res.render('show',{result:result,board:board,session:req.session});
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
