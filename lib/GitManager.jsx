import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import notie from 'notie';

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Object.map = function(o, f, ctx) {
    ctx = ctx || this;
    var result = {};
    Object.keys(o).forEach(function(k) {
        result[k] = f.call(ctx, o[k], k, o); 
    });
    return result;
}

export default class GitManager extends Component {
    constructor() {
        super();
        this.state = {
            records: {},
            currentEditor: {
                type: 'https',
                name: '',
                value: '',
                projecturl: ''
            }
        };
        // debugging
        this.dataChange = (e) => {
            var data = e.target.value;
            this.setState({data});
        }
        // debugging
        this.send = (e) => {
            
            let options = steemJS.steemRPC.Client.get()['options'];
            // reset and reconnect socket because it's unreliable...

            var Client = window.steemJS.steemRPC.Client;
            console.log(Client.close())
            var Api = Client.reset(options);
            console.log(Api);
            Api.initPromise.then(response => {
                console.log("Api ready:", response);
                var tr = new window.steemJS.TransactionBuilder();
                tr.add_type_operation("account_update", JSON.parse(this.state.data));
                tr.process_transaction(this.props.user, null, true);
                window.temptx = tr;
            });
        }
        this.onEditorChange = (e) => {
            var tg = e.target;
            let value = tg.value, 
                name = tg.id.split('editor-')[1];
            
            this.setState((prevState) => {
                let currentEditor = prevState.currentEditor;
                currentEditor[name] = value;
                return {currentEditor};
            });
            window.tg = tg;
        }
        this.addRecord = (e) => {
            let items = this.state.currentEditor;
         
            if (items.name == '') {
                notie.alert(2, 'Warning: Fill out the repo name!', 3);
                return false;
            }
            if (items.value == '') {
                notie.alert(2, 'Warning: Fill out the repo value!', 3);
                return false;
            }
            if(['https','ssh'].indexOf(items.type) == -1) {
                notie.alert(2, 'Warning: Invalid type', 3);
                return false;
            }

            // var dupe_check = this.state.records.filter((r) => JSON.stringify(r) == JSON.stringify(record));
            // if (dupe_check.length > 0) {
                // notie.alert(3, 'Error: You already have a record like that, which is exactly the same!', 3);
                // return false;
            // }
            var {name,type} = items;
            this.setState((prevState) => {
                let records = prevState.records;
                if(!(name in records)) {
                    records[name] = {}
                }
                records[name][type] = items;
                return {
                    records, 
                    currentEditor: {
                        type: 'https',
                        name: '',
                        value: '',
                        projecturl: '',
                    }
                };
            });
        }
        this.save = (e) => {
            document.getElementById('loading-overlay').style.display = "block";
            // just make sure they're sane before publishing...
            // var records = this.state.records.filter(this.validateRecord.bind(this));
            var original_userjson;
            try {
                original_userjson = JSON.parse(this.props.account.json_metadata);
            } catch(e) {
                console.error('Error parsing user JSON, clearing all data. Data was: ', this.props.account.json_metadata)
                original_userjson = {};
            }

            if(!('git' in original_userjson)) original_userjson['git'] = {};

            original_userjson['git'] = this.state.records;
            
            try {

                // let options = steemJS.steemRPC.Client.get()['options'];
                // var Api = window.steemJS.steemRPC.get();
                // console.log(Client.close())
                // var Api = Client.reset(options);
                // console.log(Api);
                // wait 2 seconds because this never works properly
                // Api.initPromise.then(response => {

                var tr = new window.steemJS.TransactionBuilder();
                let new_data = {
                    account: this.props.user.name,
                    memo_key: this.props.account.memo_key,
                    json_metadata: JSON.stringify(original_userjson)
                }
                tr.add_type_operation("account_update", new_data)
                window.pending_tx = tr.process_transaction(this.props.user, null, true)
                pending_tx.then((res) => {
                    console.log('successfully sent?');
                }, (err) => {
                    console.error('uh oh error: ', err);
                }).catch((e) => {
                    console.error('uh oh CATCH error: ', err);
                });
                document.getElementById('loading-overlay').style.display = "none";
                notie.alert(1, 'Your account was updated. Changes should be live within 60 seconds.', 3);
                // });
                

            } catch (e) {
                document.getElementById('loading-overlay').style.display = "none";
                notie.alert(3, 'There was an error building the transaction to update your JSON Metadata', 5);
                console.error('Git-steem Transaction Error: ', e);
            }
        }
        this.loadRecords.bind(this);
        this.validateRecord.bind(this);
    }

    isIp(ip) {
        var pattern = /\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/;
        return pattern.test(ip);
    }

    validateRecord(record) {
        // Passed all tests
        return true;
    }

    loadRecords(rjson) {
        var data;
        try {
            data = JSON.parse(rjson);
        } catch(e) {
            notie.alert(3, 'Invalid JSON in your metadata. Please correct your JSON via cli_wallet, or it will be ERASED when you update your records.', 10)
        }
        console.log('Loading records...');
        if('git' in data) {
            console.log('Found records. Cleaning.');        
            var clean_records = data['git'];
            console.log('Clean records are: ', clean_records);                    
            this.setState({records: clean_records});
        }
    }

    componentDidMount() {
        let md = this.props.account.json_metadata;
        console.log('mounted');
        if(md == '' || md == '{}') {
            console.log('empty json');
            return;
        }
        this.loadRecords(md);

    }

    deleteRecord(r_name, r_type) {
        this.setState((prevState) => {
            var records = prevState.records;
            delete records[r_name][r_type];
            return {records};
        });
    }

    logout() {
        localStorage.clear();
        window.location.reload(true);
    }

    render() {

        let Records = [];
        
        for(var r_name in this.state.records) {
            for(var r_type in this.state.records[r_name]) {
                var r = this.state.records[r_name][r_type];
                Records.push(<tr className="tbrecord" key={r_name + r_type} >
                    <td>{r_name}</td>
                    <td>{r_type}</td>
                    <td>{r.value}</td>
                    <td>{'projecturl' in r ? r.projecturl : ''}</td>
                    <td><button className="btn full solid red" onClick={this.deleteRecord.bind(this, r_name, r_type)}>-</button></td>
                </tr>)
            }
        };


        return (
            <div>
                <h1>Logged in as @{this.props.user.name} <a style={{float: 'right'}} href="#" onClick={this.logout}>Logout</a></h1>
                <hr/>
                <h2>Record Editor</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Repo Name</th>
                            <th>Connection Type</th>
                            <th>Repo URL</th>
                            <th>Project Website or Steemit URL (optional)</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {Records}
                        <tr>
                            <td>
                                <input type="text" id="editor-name" value={this.state.currentEditor.name} onChange={this.onEditorChange} />
                            </td>
                            <td>
                                <select name="editor-type" id="editor-type" value={this.state.currentEditor.type} onChange={this.onEditorChange} >
                                    <option value="https">HTTPS (git://)</option>
                                    <option value="ssh">SSH</option>
                                </select>
                            </td>
                            <td>
                                <input type="text" id="editor-value" value={this.state.currentEditor.value} onChange={this.onEditorChange} />
                            </td>
                            <td>
                                <input type="text" id="editor-projecturl" value={this.state.currentEditor.projecturl} onChange={this.onEditorChange} />
                            </td>
                            <td>
                                <button className="btn full solid blue" onClick={this.addRecord}>+</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <button className="btn full solid green" onClick={this.save}>Save Records Now</button>
                <hr/>
            </div>
        )
    }
}