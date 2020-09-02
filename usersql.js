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
