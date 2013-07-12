#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var util = require('util');
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html:process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var buildfn = function(urlstr, checksfile) {
    var response2cheerio = function(result, reponse) {
        if (result instanceof Error) {
            console.log("%s does not exist. Exiting.", urlstr);
            process.exit(1);
        } else {
            var source = cheerio.load(result);
            var checkJson = check(source, checksfile);
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson)
        }
    };
    return response2cheerio;
};

var cheerioURL = function(url, checksfile) {
    var response2cheerio = buildfn(url, checksfile);
    return rest.get(url).on('complete', response2cheerio);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var check = function(source, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = source(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url_path>', 'URL for index.html')
        .parse(process.argv)
    if (!program.url) {
        var checkJson = check(cheerioHtmlFile(program.file), program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson)
    } else {
        cheerioURL(program.url, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
