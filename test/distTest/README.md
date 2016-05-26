This is a small test suite to enshure that the lib files work
in the following environments:

- Commonjs
- AMD
- Global

It also checks package integrity for npm and bower. Note that these are no
unit tests. There are small html files, one for every test case. They are also
good examples of how to get intermix up in these environments.

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

### Notes

The Bower build uses the head commit in the local master branch while npm
uses the files on disk. This means that local changes are not available in
all tests until you commit them. If you want to try out sth. that you don't want
to publish, do a commit and then "git reset --hard HEAD~".

Bower build can take some time, even on fast machines.

Test suite is verified to run on Windows and Linux with Chrome and Firefox.
Other configurations may work.
