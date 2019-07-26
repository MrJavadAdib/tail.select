/*!
 |  COMPILER SCRIPT FOR TS AND LESS
 |  @file       ./index.js
 |  @author     SamBrishes <sam@pytes.net>
 |  @version    1.0.0 [1.0.0] - Stable
 |
 |  @website    https://github.com/pytesNET/tail.select
 |  @license    X11 / MIT License
 |  @copyright  Copyright © 2019 SamBrishes, pytesNET <info@pytes.net>
 */
/*
 |  THIS node.js SCRIPT COMPILES THE TYPESCRIPT AND LESS FILES
 |  @thanksTo   https://github.com/Microsoft/TypeScript/issues/6387#issuecomment-169739615
 */

/*
 |  LOAD CORE PACKAGES
 */
const fs = require("fs");
const path = require("path");

/*
 |  LOAD TYPESCRIPT DEPENDENCIES
 */
const ts = require("typescript");
const minifyES5 = require("uglify-js");
const minifyES6 = require("uglify-es");

/*
 |  LOAD LESS DEPENDENCIES
 */
const less = require("less");
const clean = require("clean-css");

/*
 |  MAIN DATA
 */
const package = JSON.parse(fs.readFileSync("../package.json").toString());
const cheader = `/*
 |  ${package.name} - ${package.description}
 |  @file       {path}{file}
 |  @author     SamBrishes <sam@pytes.net>
 |  @version    ${package.version} - ${package.status.charAt(0).toUpperCase() + package.status.slice(1)}
 |
 |  @website    https://github.com/pytesNET/${package.version}
 |  @license    X11 / MIT License
 |  @copyright  Copyright © 2014 - ${(new Date()).getFullYear()} SamBrishes, pytesNET <info@pytes.net>
 */`;
const cminified = `/* pytesNET/${package.name} v${package.version} | {version} | @author SamBrishes, pytesNET <info@pytes.net> */`;

/*
 |  JAVASCRIPT FILE
 */
const fileES5 = `;(function(root, factory) {
    if(typeof define === "function" && define.amd) {
        define(function() { return factory(root, root.document); });
    } else if(typeof module === "object" && module.exports) {
        module.exports = factory(root, root.document);
    } else {
        if(typeof root.tail === "undefined") {
            root.tail = { };
        }
        root.${package.name} = factory(root, root.document);

        // jQuery Support
        if(typeof jQuery !== "undefined") {
            jQuery.fn.${package.jquery} = function(o) {
                var r = [], i;
                this.each(function() { if((i = ${package.name}(this, o)) !== false) { r.push(i); } });
                return (r.length === 1)? r[0]: (r.length === 0)? false: r;
            };
        }

        // MooTools Support
        if(typeof(MooTools) !== "undefined") {
            Element.implement({ ${package.mootools}: function(o) { return new ${package.name}(this, o); } });
        }
    }
}(window, function(w, d) {
{code}
    return Select;
}));`;

/*
 |  ECMASCRIPT FILE
 */
const fileES6 = `let { select, options } = (function(root){
{code}
    return {select: select, options: options};
})(window || this);
export {select, options};`

/*
 |  LESS FILE
 */
const fileLess = `@charset "UTF-8";`


//
// TYPESCRIPT RENDERING
//

/*
 |  TYPESCRIPT :: REPORTER
 */
function report(diagnostics){
    diagnostics.forEach((diagnostic) => {
        let message = "Error";
        if(diagnostic.file){
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        }
        message += ": " + ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        console.log(message);
    });
}

/*
 |  TYPESCRIPT :: CONFIG PARSER
 */
function readConfig(filename){
    const filein = fs.readFileSync(filename).toString();
    const result = ts.parseConfigFileTextToJson(filename, filein);
    const config = result.config;
    if(!config){
        report([result.error]);
        process.exit(1);
    }

    const parse = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(filename));
    if(parse.errors.length > 0){
        report(parse.errors);
        process.exit(1);
    }
    return parse;
}

/*
 |  TYPESCRIPT :: COMPILER
 */
function compileTS(){
    let config = readConfig("ts/tsconfig.json");
    let host = ts.createCompilerHost(config.options);
    let sourceFile = host.getSourceFile;

    // ES5 JavaScript
    (function(config){
        host.getSourceFile = function(filename) {
            if(filename === "ts/options.ts"){
                let file = fs.readFileSync("./ts/options.ts").toString();
                file = file.replace(/[ ]+\/\/\/\@ts\-target\:ES6\s+([\s\S]*)\/\/\/\@ts\-target\:ES6/gm, "");
                return ts.createSourceFile(filename, file, ts.ScriptTarget.ES5, true);
            }
            return sourceFile.call(host, filename);
        }
        let program = ts.createProgram(config.fileNames, config.options, host);
        let emitResult = program.emit();
        report(ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics));
        if(emitResult.emitSkipped){
            process.exit(1);
        }
    }(config));

    // ES6 JavaScript
    config.options.target = 2;
    config.options.outFile = "../dist/js/tail.select-es6.js";
    (function(config){
        host.getSourceFile = function(filename) {
            if(filename === "ts/options.ts"){
                let file = fs.readFileSync("./ts/options.ts").toString();
                file = file.replace(/[ ]+\/\/\/\@ts\-target\:ES5\s+([\s\S]*)\/\/\/\@ts\-target\:ES5/gm, "");
                return ts.createSourceFile(filename, file, ts.ScriptTarget.ES2015, true);
            }
            return sourceFile.call(host, filename);
        }
        let program = ts.createProgram(config.fileNames, config.options, host);
        let emitResult = program.emit();
        report(ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics));
        if(emitResult.emitSkipped){
            process.exit(1);
        }
    }(config));
}

/*
 |  TYPESCRIPT :: HANDLER
 */
function handleTS(file){
    let realpath = "./js/";
    let realfile = file.split("/").pop();
    let filename = realfile.split(".js").shift();
    let  content = (filename == "tail.select-es6")? fileES6: fileES5;

    // Read File
    fs.readFile(file, "utf-8", (err, data) => {
        if(err){
            console.log(err);
            process.exit(1);
        }

        // Prepare Code
        let code = data.split("\n").filter((l) => { 
            return l.startsWith("/// <") || l.trim().startsWith("///@")? false: true; 
        });
        let source = code.pop();

        // Prepare Content
        content = cheader.replace("{path}", realpath).replace("{file}", realfile)
                + "\n" + content.replace("{code}", code.map((l) => { 
                    if(/(^|(    )+)\/(\/|\*)/.test(l)){
                        return "\n    " + l;
                    }
                    if(/(^|\s+)\S+\/\//.test(l)){
                        l = l.split("//")[0];
                    }
                    return (l == "//" || l == "//\r")? "": "    " + l; 
                }).join("\n")).replace(/\}\s+(else)/gm, "} else") + "\n" + source;

        // Minify
        let result = (filename == "tail.select-es6"? minifyES6: minifyES5).minify(content, {
            compress: {
                dead_code: true,
                keep_fnames: true,
                toplevel: false,
                unused: false,
                warnings: true
            },
            mangle: {
                keep_fnames: true
            },
            sourceMap: {
                filename: `${filename}.min.js`,
                url: `${filename}.min.js.map`
            },
            toplevel: false,
            warnings: true
        });
        if(result.error){
            console.log(result.error);
        }
        if(result.warnings){
            console.log(result.warnings);
        }

        // Minified Content
        minified = cminified.replace("{version}", 
                    (filename == "tail.select-es6"? "ECMAScript 2015 (ES6)": "JavaScript (ES5)")
                   ) + "\n" + result.code;
        minifiedmap = result.map;

        // Write Files
        fs.writeFile(`../dist/js/${filename}.js`, content, "utf-8", (err) => {
            if(err){
                console.log(err);
                process.exit(1);
            }
        });
        fs.writeFile(`../dist/js/${filename}.min.js`, minified, "utf-8", (err) => {
            if(err){
                console.log(err);
                process.exit(1);
            }
        });
        fs.writeFile(`../dist/js/${filename}.min.js.map`, minifiedmap, "utf-8", (err) => {
            if(err){
                console.log(err);
                process.exit(1);
            }
        });
    });
}


//
//  LESS RENDERING
//

/*
 |  LESS :: COMPILER
 */
function compileLess(){
    //@pass;
}

/*
 |  LESS :: HANDLE FILES
 */
function handleLess(){
    //@pass;
}

/*
 |  MAIN SCRIPT
 */
function main(){
    compileTS();
    handleTS("../dist/js/tail.select.js");
    handleTS("../dist/js/tail.select-es6.js");
}
main();
