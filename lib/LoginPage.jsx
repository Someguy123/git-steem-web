import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import notie from 'notie';



export default class LoginPage extends Component {
    constructor() {
        super();
        this.state = {username:'',password:''};
        this.onUsernameChange = (e) => {
            var username = e.target.value;
            this.setState({username});
        };
        this.onPasswordChange = (e) => {
            var password = e.target.value;
            this.setState({password});
        };
        this.login.bind(this);
    }

    componentDidMount() {
        if (localStorage.getItem("username") !== null) {
            this.props.login(
                localStorage.getItem("username"), 
                localStorage.getItem("password")
            );
        }
    }

    login(e) {
        e.preventDefault();
        var {username, password} = this.state;
        
        this.props.login(username, password)
    }
    render() {
        return (
            <div>
                <h1>Welcome to Steem DNS. The online manager for your blockchain-based domain.</h1>
                <form className="full-width-forms" onSubmit={this.login.bind(this)}>
                    <label htmlFor="username">Username</label>
                    <input type="text" onChange={this.onUsernameChange} /><br/>
                    <label htmlFor="password">Active Private Key (or master password) </label>
                    <input type="password" onChange={this.onPasswordChange} />
                    <hr/>
                    <button className="btn">Login</button>
                </form>

                <h3><strong>Problems?</strong></h3>
                <p>Make sure you're using either your <strong>MASTER PASSWORD</strong>, or the <strong>owner/active PRIVATE key</strong> (NOT THE PUBLIC KEY, AND NO, YOUR POSTING/MEMO KEY WILL NOT WORK EITHER)</p>
                <p>Some people have reported problems with Firefox, if you keep having problems, try it in Google Chrome, or Microsoft Edge before reporting an issue.</p>
                <p>We do NOT store your password or key in any form whatsoever. All operations happen in your browser, and are not logged or monitored by us.</p>
            </div>
        )
    }
}

