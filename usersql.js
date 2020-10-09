//usrsql.js
// DATABASE SETTING //
var mysql = require('mysql');

var conn = mysql.createConnection({
    host:'localhost',
    port:3306,
    user:'root',
    password:'wogus4735',
    database:'hg'
});
///////////////////////

conn.connect(function(err){
    if (err) {
        console.error('mysql connection error');
        console.error(err);
        throw err;
    }
});

exports.userinfo = function(Name,callback){
    var q = 'SELECT point,win,draw,lose from users where name="'+Name+'"';
    conn.query(q,function(err,result,field){
        if(err){callback(true,null);}
        callback(null,result);
    });
};

exports.getfiveboard = function(board,callback){
    var q = 'SELECT id,title FROM '+board+' ORDER BY id DESC LIMIT 6';
    conn.query(q,function(err,result,field){
        if(err){callback(true);}
        callback(null,result);
    });
};

exports.FindNick = function(Nick,callback){
    var q = 'SELECT name from users where name="'+Nick+'"';
    conn.query(q,function(err,result,field){
        if(err){callback(true,null);}
        callback(null,result);
    });
};

exports.FindId = function(Id,callback){
    var q = 'SELECT id from users where id="'+Id+'"';
    conn.query(q,function(err,result,field){
        if(err){callback(true,null);}
        callback(null,result);
    });
};

exports.register = function(name,id,pw,callback){
    conn.query('insert into users (name, id, pw) values ("' + name + '","' + id + '","' + pw + '")', function(err, rows) {
        if(err) { callback(true);}
        console.log(name+"님 회원가입 완료!");
    });
};

exports.login = function(Id,callback){
    var q = 'SELECT name,id,pw from users where id="'+Id+'"';
    conn.query(q,function(err,result,field){
        if(err){callback(true,null);}
        callback(null,result);
    });
};

exports.boardWrite = function(id,title,contents,name,callback){
    var q = 'insert into '+id+' (title, contents, name) values ("' + title + '","' + contents + '","' + name + '")';
    conn.query(q,function(err,result,field){
        if(err){callback(true);}
    });
};

exports.boardCheck = function(id,callback){
    var q = 'SELECT id,title,name,time,ck FROM '+id+' ORDER BY id DESC';
    conn.query(q,function(err,result,field){
        if(err){callback(true,null);}
        callback(null,result);
    });
};

exports.showWrite = function(board,id,callback){
    var q = 'SELECT title,contents,name,time,ck FROM '+board+' WHERE id='+id;
    conn.query(q,function(err,result,field){
        if(err){callback(true);}
        callback(null,result);
    });
};

exports.upBoard = function(board,id,callback){
    var q = 'UPDATE '+board+' SET ck=ck+1 WHERE id='+id;
    conn.query(q,function(err,result,field){
        if(err){callback(true);}
    });
};

exports.getfiveboard = function(board,callback){
    var q = 'SELECT id,title FROM '+board+' ORDER BY id DESC LIMIT 6';
    conn.query(q,function(err,result,field){
        if(err){callback(true);}
        callback(null,result);
    });
};

exports.boardUpdate = function(id,title,contents,num,callback){
  var q = 'UPDATE '+id+' SET title="'+title+'", contents="'+contents+'" WHERE id='+num;
  conn.query(q,function(err,result,field){
      if(err){callback(true);}
  });
};

exports.findNickWrite = function(board, num, callback){
    var q = 'SELECT name FROM '+board+' WHERE id='+num;
    conn.query(q,function(err,result,field){
        if(err){callback(true);}
        callback(null,result);
    });
};

exports.deleteWrite = function(board,num,callback){
    var q = 'DELETE FROM '+board+ ' WHERE id='+num;
    conn.query(q,function(err,result,field){
        if(err){callback(true);}
    });
};

exports.ranking = function(callback){
    var q = 'SELECT name,win,draw,lose FROM users ORDER BY win-lose DESC LIMIT 100';
    conn.query(q,function(err,result,field){
        if(err){callback(true,null);}
        callback(null,result);
    });
};

exports.playgame = function(callback){
    var q = 'SELECT * FROM game ORDER BY id DESC';
    conn.query(q,function(err,result,field){
        if(err){callback(true,null);}
        callback(null,result);
    });
};
