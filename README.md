About
=====
This is a Web UI for the Git-Steem standard. It authenticates using [SVK's SteemJS](https://github.com/svk31/steemjs-lib)
and is completely in-browser.

This Web UI was created by [@Someguy123](https://steemit.com/@someguy123), and published on Github under the 
GNU Affero GPL.

It doesn't require any web server to operate. It does however require an RPC server, either self-hosted STEEMD, 
or a public steem service like [steem.ws](https://steem.ws).

License
=====
GNU Affero GPL - check LICENSE for more information.

tl;dr; - if you make any changes to this project, you need to contribute them back, even if you 
don't redistribute the code in any format, and are expected to inform people using your service 
that the code was taken from here.

Install
=====

    git clone https://github.com/Someguy123/git-steem-web.git
    cd git-steem-web
    # use node 6, best to use NVM
    nvm use v6

    # install deps
    npm install -g webpack webpack-cli webpack-dev-server babel-cli
    npm install

    # DEVELOPMENT (with live updates as you edit)
    node hotloader.js

    # PRODUCTION (minified, no-live-updates single production.js file)
    webpack