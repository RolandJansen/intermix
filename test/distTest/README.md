This is a small test suite to enshure that the lib files work
in the following environments:

- Commonjs
- AMD
- Global

It also checks package integrity for npm and bower. Note that these are no
unit tests. There are small html files, one for every test case. They are also
good examples of how to get intermix up in these environments.

WARNING: This is verified to run on Windows! Unix-like OS may work.

If you want to run the tests, make shure that no webserver is running on
port 8080. If so, shut it down temporarily. Then go to the root folder and type

    > npm start

It runs several tasks:

- download npm dependencies including a local version of intermix (files on disk)
- download bower dependencies including a local version of intermix (git head master)
- build a testapp (index.js) with browserify
- start a webserver

Open a browser and go to "localhost:8080". You should see five buttons
(in iframes). Every button should play a sound. If not, something went wrong and you should
check the error console. If the test is done, don't forget to shutdown the
server (in the terminal window hit ctrl-c).

To avoid confusion: npm/bower packages are build differently. Bower uses the
latest commit in the master branch of the local repository clone while npm
uses the files on disk. The difference is, that changes on files are immediately
available on every test run in the Commonjs test while you have to "git add/commit"
the changes to be available on all other tests.
