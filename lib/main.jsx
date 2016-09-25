import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import GitManager from './GitManager';
import LoginPage from './LoginPage';
import notie from 'notie';

const options = {
    apis: ["database_api", "network_broadcast_api"],
    // url: "wss://node.steem.ws"
    url: "wss://steemit.com:443/wspa"
};


class App extends Component {
    constructor() {
        super();
        this.state = {
            loggedIn: false,
            username: '',
            password:'',
            // USER OBJECT FROM SteemJS
            user: {},
            rawAccount: {}
        };


        // Dirty temporary fix for https://github.com/svk31/steemjs-lib/issues/2
        // Pulse the websocket every 20 seconds for block number 1, just to make
        // sure the websocket doesn't disconnect.
        this.nop = () => {
            var Api = window.steemJS.steemRPC.Client.get(options, true);            
            Api.initPromise.then(function(res) {
                Api.database_api().exec("get_block", [1]).then(function(res) {});
            });
        }
        setInterval(this.nop, 20000);
        this.login = (username,password) => {
            document.getElementById('loading-overlay').style.display = "block";
            var user = new window.steemJS.Login();
            user.setRoles(["active"]);
            // Successful login
            var _login = (username, password, _user) => {
                document.getElementById('loading-overlay').style.display = "none";
                if(localStorage.getItem("username") === null){
                    localStorage.setItem("username", username); //save it all
                    localStorage.setItem("password", password);
                }
                notie.alert(1, "Successfully logged in.", 2);
                this.setState({username,password, user: _user, loggedIn: true});
            };
            console.log(options);

            var _this = this;
            var Api = window.steemJS.steemRPC.Client.get(options, true);
            // Input checks
            if(password == null || password == '') {
                notie.alert(3, "Enter a password");
                return;
            }
            if(username == null || username == '') {
                notie.alert(3, "Enter a username");
                return;
            }

            // Actual login attempt
            Api.initPromise.then(function(res) {

                Api.database_api().exec("get_accounts", [[username]]).then(function(res) {
                    if(res.length < 1) {
                        notie.alert(3, "No account found");
                        return
                    }

                    var account = res[0];
                    _this.setState({rawAccount: res[0]});
                    try {
                        var login_data = {
                            accountName: username,
                            auths: {
                                owner: account.owner.key_auths,
                                active: account.active.key_auths,
                                posting: account.posting.key_auths
                            }
                        }
                        // Clone object
                        var with_key = JSON.parse(JSON.stringify(login_data));
                        var with_pass = JSON.parse(JSON.stringify(login_data));
                        with_pass['password'] = password;
                        with_key['privateKey'] = password;
                        // first try owner/active key
                        try {
                            let success_key = user.checkKeys(with_key);
                            if(success_key) {
                                _login(username, password, user);
                                return;                            
                            }
                        } catch(e) {
                            console.warn('error trying key. moving to pass');
                        }

                        // now try password
                        let success_pass = user.checkKeys(with_pass);                        

                        if(success_pass){ // we're in.
                            _login(username, password, user);                        
                            return;
                        }
                        // user entered the wrong credentials.
                        notie.alert(3, "Invalid username or password/key.", 4);
                        document.getElementById('loading-overlay').style.display = "none";                        
                        return;
                    } catch(err){
                        notie.alert(3, "There was an error: ".concat(err), 4);
                        document.getElementById('loading-overlay').style.display = "none";                        
                    }
                });
            });

        }
    }

    render() {
        return (
            <div>
                {this.state.loggedIn
                    ? <GitManager username={this.state.username} user={this.state.user} account={this.state.rawAccount} />
                    : <LoginPage login={this.login} />
                }
            </div>
        )
    }
}

ReactDOM.render(<App/>, document.getElementById('container'));

