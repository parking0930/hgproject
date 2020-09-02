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
