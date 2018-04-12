#!/bin/bash
set -e #Exit immediately if a command exits with a non-zero status.
set -v #verbose
set -u #Treat unset variables as an error when substituting.

#build templates
node_modules/.bin/handlebars tmpl/popup.tmpl -s -f js/popup.tmpl.js -k and -k not
sed '1 i\module.exports = ' -i js/*.tmpl.js
#build JS
#set +v
#if [ "${DEBUG:-false}" != true ]
#then
#    BUILD_OPTIONS="-t [ babelify --presets [ es2015  ] ] -t [ uglifyify ]"
#    echo "Building RELEASE build. For faster builds use DEBUG=true ./build.sh"
#else
    BUILD_OPTIONS=""
#    echo "Building DEBUG build."
#fi
set -v
node_modules/.bin/browserify $BUILD_OPTIONS js/popup.js -o ext/popup.js
node_modules/.bin/browserify $BUILD_OPTIONS js/background.js -o ext/background.js
node_modules/.bin/browserify $BUILD_OPTIONS js/content.js -o ext/content.js
#copy CSS
cp ./node_modules/bootstrap/dist/css/*.min.css ./ext/
#create ext zip for submission
rm coinbought.zip || true
cd ext
zip -r ../coinbought.zip  . *
