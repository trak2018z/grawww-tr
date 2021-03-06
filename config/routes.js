var express = require('express');
var router = express.Router();
var registration = require('./../authentication/register.js');
var passport = require('./../authentication/passport.js');
var herocreator = require('./../game/createhero.js')
var connection = require('./database.js');

router.get('/', function (req, res) {
    res.render('home');
});

router.post('/register', registration.register);

router.post('/login', passport.authenticate('local', {
    successRedirect: '/profil',
    failureRedirect: '/'
}));

router.get('/logout', function (req, res) {
    req.logout();
    req.session.destroy(() => {
        res.clearCookie('connect.sid')
        res.redirect('/')
    })
});

router.get('/profil', blockguest(), function (req, res) {
    connection.query('SELECT * FROM hero WHERE user = ?', [req.user.user_id], function (err, results, fields) {
        res.render('profil', {
            name: results[0].name,
            points: results[0].points,
            energy: results[0].energy,
            maxenergy: results[0].maxenergy,
            hp: results[0].hp,
            maxhp: results[0].maxhp,
            damage: results[0].damage,
            armor: results[0].armor,
            skill: results[0].skill,
            gold: results[0].gold
        });
    });
});

router.get('/herocreator', function (req, res) {
    if (req.isAuthenticated())
        connection.query('SELECT * FROM hero WHERE user = ?', [req.user.user_id], function (err, results, fields) {
            if (results.length > 0) res.redirect('/profil');
            else res.render('herocreator');
        });
    else res.redirect('/');
});

router.post('/createhero', herocreator.create);

router.get('/ranking', blockguest(), function (req, res) {
    connection.query('SELECT name, points FROM hero', null, function (err, results, fields) {
        results.sort(function (a, b) {
            return a.points < b.points;
        });
        results.sort();
        res.render('ranking', {
            table: results
        });
    });
});

router.get('/zajecia', blockguest(), function (req, res) {
    connection.query('SELECT * FROM job', null, function (err, results, fields) {
        var jobs = results;
        connection.query('SELECT points, gold, energy, maxenergy FROM hero WHERE user = ?', [req.user.user_id], function (err, results, fields) {
            res.render('zajecia', {
                jobs: jobs,
                hero: results,
                helpers : {
                    calc: function(a,b,c) {return a + Math.floor(b * c)}
                }
            });
        });
    });
});

router.get('/walka', blockguest(), function (req, res) {
    connection.query('SELECT * FROM hero WHERE user = ?', [req.user.user_id], function (err, results, fields) {
        var hero = results;
        var max = results[0].points + 50;
        var min = results[0].points - 50;
        connection.query('SELECT name, points FROM hero WHERE user <> ? AND points < ? AND points > ?', [req.user.user_id, max, min], function (err, results, fields) {
            results.sort(function (a, b) {
                return a.points < b.points;
            });
            results.sort();
            res.render('walka', {
                table: results,
                hero: hero
            });
        });
    });
});

router.get('/auth/google', passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/plus.login']
}));

router.get('/auth/google/callback',
    passport.authenticate('google'),
    function (req, res) {
        res.redirect('/profil');
    }
);

function blockguest() {
    return (req, res, next) => {
        if (req.isAuthenticated()) {
            connection.query('SELECT * FROM hero WHERE user = ?', [req.user.user_id], function (err, results, fields) {
                if (results.length == 0) res.redirect('/herocreator');
                else return next();

            });
        } else res.redirect('/');
    }
}


module.exports = router;
