(function () {
  if (window['include'] === undefined) {
    //mustache.js
    (function (global, factory) { typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = global || self, global.Mustache = factory()) })(this, function () { "use strict"; var objectToString = Object.prototype.toString; var isArray = Array.isArray || function isArrayPolyfill(object) { return objectToString.call(object) === "[object Array]" }; function isFunction(object) { return typeof object === "function" } function typeStr(obj) { return isArray(obj) ? "array" : typeof obj } function escapeRegExp(string) { return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&") } function hasProperty(obj, propName) { return obj != null && typeof obj === "object" && propName in obj } function primitiveHasOwnProperty(primitive, propName) { return primitive != null && typeof primitive !== "object" && primitive.hasOwnProperty && primitive.hasOwnProperty(propName) } var regExpTest = RegExp.prototype.test; function testRegExp(re, string) { return regExpTest.call(re, string) } var nonSpaceRe = /\S/; function isWhitespace(string) { return !testRegExp(nonSpaceRe, string) } var entityMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "/": "&#x2F;", "`": "&#x60;", "=": "&#x3D;" }; function escapeHtml(string) { return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) { return entityMap[s] }) } var whiteRe = /\s*/; var spaceRe = /\s+/; var equalsRe = /\s*=/; var curlyRe = /\s*\}/; var tagRe = /#|\^|\/|>|\{|&|=|!/; function parseTemplate(template, tags) { if (!template) return []; var lineHasNonSpace = false; var sections = []; var tokens = []; var spaces = []; var hasTag = false; var nonSpace = false; var indentation = ""; var tagIndex = 0; function stripSpace() { if (hasTag && !nonSpace) { while (spaces.length) delete tokens[spaces.pop()] } else { spaces = [] } hasTag = false; nonSpace = false } var openingTagRe, closingTagRe, closingCurlyRe; function compileTags(tagsToCompile) { if (typeof tagsToCompile === "string") tagsToCompile = tagsToCompile.split(spaceRe, 2); if (!isArray(tagsToCompile) || tagsToCompile.length !== 2) throw new Error("Invalid tags: " + tagsToCompile); openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + "\\s*"); closingTagRe = new RegExp("\\s*" + escapeRegExp(tagsToCompile[1])); closingCurlyRe = new RegExp("\\s*" + escapeRegExp("}" + tagsToCompile[1])) } compileTags(tags || mustache.tags); var scanner = new Scanner(template); var start, type, value, chr, token, openSection; while (!scanner.eos()) { start = scanner.pos; value = scanner.scanUntil(openingTagRe); if (value) { for (var i = 0, valueLength = value.length; i < valueLength; ++i) { chr = value.charAt(i); if (isWhitespace(chr)) { spaces.push(tokens.length); indentation += chr } else { nonSpace = true; lineHasNonSpace = true; indentation += " " } tokens.push(["text", chr, start, start + 1]); start += 1; if (chr === "\n") { stripSpace(); indentation = ""; tagIndex = 0; lineHasNonSpace = false } } } if (!scanner.scan(openingTagRe)) break; hasTag = true; type = scanner.scan(tagRe) || "name"; scanner.scan(whiteRe); if (type === "=") { value = scanner.scanUntil(equalsRe); scanner.scan(equalsRe); scanner.scanUntil(closingTagRe) } else if (type === "{") { value = scanner.scanUntil(closingCurlyRe); scanner.scan(curlyRe); scanner.scanUntil(closingTagRe); type = "&" } else { value = scanner.scanUntil(closingTagRe) } if (!scanner.scan(closingTagRe)) throw new Error("Unclosed tag at " + scanner.pos); if (type == ">") { token = [type, value, start, scanner.pos, indentation, tagIndex, lineHasNonSpace] } else { token = [type, value, start, scanner.pos] } tagIndex++; tokens.push(token); if (type === "#" || type === "^") { sections.push(token) } else if (type === "/") { openSection = sections.pop(); if (!openSection) throw new Error('Unopened section "' + value + '" at ' + start); if (openSection[1] !== value) throw new Error('Unclosed section "' + openSection[1] + '" at ' + start) } else if (type === "name" || type === "{" || type === "&") { nonSpace = true } else if (type === "=") { compileTags(value) } } stripSpace(); openSection = sections.pop(); if (openSection) throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos); return nestTokens(squashTokens(tokens)) } function squashTokens(tokens) { var squashedTokens = []; var token, lastToken; for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) { token = tokens[i]; if (token) { if (token[0] === "text" && lastToken && lastToken[0] === "text") { lastToken[1] += token[1]; lastToken[3] = token[3] } else { squashedTokens.push(token); lastToken = token } } } return squashedTokens } function nestTokens(tokens) { var nestedTokens = []; var collector = nestedTokens; var sections = []; var token, section; for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) { token = tokens[i]; switch (token[0]) { case "#": case "^": collector.push(token); sections.push(token); collector = token[4] = []; break; case "/": section = sections.pop(); section[5] = token[2]; collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens; break; default: collector.push(token) } } return nestedTokens } function Scanner(string) { this.string = string; this.tail = string; this.pos = 0 } Scanner.prototype.eos = function eos() { return this.tail === "" }; Scanner.prototype.scan = function scan(re) { var match = this.tail.match(re); if (!match || match.index !== 0) return ""; var string = match[0]; this.tail = this.tail.substring(string.length); this.pos += string.length; return string }; Scanner.prototype.scanUntil = function scanUntil(re) { var index = this.tail.search(re), match; switch (index) { case -1: match = this.tail; this.tail = ""; break; case 0: match = ""; break; default: match = this.tail.substring(0, index); this.tail = this.tail.substring(index) }this.pos += match.length; return match }; function Context(view, parentContext) { this.view = view; this.cache = { ".": this.view }; this.parent = parentContext } Context.prototype.push = function push(view) { return new Context(view, this) }; Context.prototype.lookup = function lookup(name) { var cache = this.cache; var value; if (cache.hasOwnProperty(name)) { value = cache[name] } else { var context = this, intermediateValue, names, index, lookupHit = false; while (context) { if (name.indexOf(".") > 0) { intermediateValue = context.view; names = name.split("."); index = 0; while (intermediateValue != null && index < names.length) { if (index === names.length - 1) lookupHit = hasProperty(intermediateValue, names[index]) || primitiveHasOwnProperty(intermediateValue, names[index]); intermediateValue = intermediateValue[names[index++]] } } else { intermediateValue = context.view[name]; lookupHit = hasProperty(context.view, name) } if (lookupHit) { value = intermediateValue; break } context = context.parent } cache[name] = value } if (isFunction(value)) value = value.call(this.view); return value }; function Writer() { this.templateCache = { _cache: {}, set: function set(key, value) { this._cache[key] = value }, get: function get(key) { return this._cache[key] }, clear: function clear() { this._cache = {} } } } Writer.prototype.clearCache = function clearCache() { if (typeof this.templateCache !== "undefined") { this.templateCache.clear() } }; Writer.prototype.parse = function parse(template, tags) { var cache = this.templateCache; var cacheKey = template + ":" + (tags || mustache.tags).join(":"); var isCacheEnabled = typeof cache !== "undefined"; var tokens = isCacheEnabled ? cache.get(cacheKey) : undefined; if (tokens == undefined) { tokens = parseTemplate(template, tags); isCacheEnabled && cache.set(cacheKey, tokens) } return tokens }; Writer.prototype.render = function render(template, view, partials, tags) { var tokens = this.parse(template, tags); var context = view instanceof Context ? view : new Context(view, undefined); return this.renderTokens(tokens, context, partials, template, tags) }; Writer.prototype.renderTokens = function renderTokens(tokens, context, partials, originalTemplate, tags) { var buffer = ""; var token, symbol, value; for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) { value = undefined; token = tokens[i]; symbol = token[0]; if (symbol === "#") value = this.renderSection(token, context, partials, originalTemplate); else if (symbol === "^") value = this.renderInverted(token, context, partials, originalTemplate); else if (symbol === ">") value = this.renderPartial(token, context, partials, tags); else if (symbol === "&") value = this.unescapedValue(token, context); else if (symbol === "name") value = this.escapedValue(token, context); else if (symbol === "text") value = this.rawValue(token); if (value !== undefined) buffer += value } return buffer }; Writer.prototype.renderSection = function renderSection(token, context, partials, originalTemplate) { var self = this; var buffer = ""; var value = context.lookup(token[1]); function subRender(template) { return self.render(template, context, partials) } if (!value) return; if (isArray(value)) { for (var j = 0, valueLength = value.length; j < valueLength; ++j) { buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate) } } else if (typeof value === "object" || typeof value === "string" || typeof value === "number") { buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate) } else if (isFunction(value)) { if (typeof originalTemplate !== "string") throw new Error("Cannot use higher-order sections without the original template"); value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender); if (value != null) buffer += value } else { buffer += this.renderTokens(token[4], context, partials, originalTemplate) } return buffer }; Writer.prototype.renderInverted = function renderInverted(token, context, partials, originalTemplate) { var value = context.lookup(token[1]); if (!value || isArray(value) && value.length === 0) return this.renderTokens(token[4], context, partials, originalTemplate) }; Writer.prototype.indentPartial = function indentPartial(partial, indentation, lineHasNonSpace) { var filteredIndentation = indentation.replace(/[^ \t]/g, ""); var partialByNl = partial.split("\n"); for (var i = 0; i < partialByNl.length; i++) { if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) { partialByNl[i] = filteredIndentation + partialByNl[i] } } return partialByNl.join("\n") }; Writer.prototype.renderPartial = function renderPartial(token, context, partials, tags) { if (!partials) return; var value = isFunction(partials) ? partials(token[1]) : partials[token[1]]; if (value != null) { var lineHasNonSpace = token[6]; var tagIndex = token[5]; var indentation = token[4]; var indentedValue = value; if (tagIndex == 0 && indentation) { indentedValue = this.indentPartial(value, indentation, lineHasNonSpace) } return this.renderTokens(this.parse(indentedValue, tags), context, partials, indentedValue, tags) } }; Writer.prototype.unescapedValue = function unescapedValue(token, context) { var value = context.lookup(token[1]); if (value != null) return value }; Writer.prototype.escapedValue = function escapedValue(token, context) { var value = context.lookup(token[1]); if (value != null) return mustache.escape(value) }; Writer.prototype.rawValue = function rawValue(token) { return token[1] }; var mustache = { name: "mustache.js", version: "4.0.1", tags: ["{{", "}}"], clearCache: undefined, escape: undefined, parse: undefined, render: undefined, Scanner: undefined, Context: undefined, Writer: undefined, set templateCache(cache) { defaultWriter.templateCache = cache }, get templateCache() { return defaultWriter.templateCache } }; var defaultWriter = new Writer; mustache.clearCache = function clearCache() { return defaultWriter.clearCache() }; mustache.parse = function parse(template, tags) { return defaultWriter.parse(template, tags) }; mustache.render = function render(template, view, partials, tags) { if (typeof template !== "string") { throw new TypeError('Invalid template! Template should be a "string" ' + 'but "' + typeStr(template) + '" was given as the first ' + "argument for mustache#render(template, view, partials)") } return defaultWriter.render(template, view, partials, tags) }; mustache.escape = escapeHtml; mustache.Scanner = Scanner; mustache.Context = Context; mustache.Writer = Writer; return mustache });
    /////////////////////////////////////////////
    function log() {
      //cosnole.log(arguments)
    }

    class Tag {
      constructor(tagName, source) {
        console.assert(tagName)
        console.assert(source)
        this.source = source
        //https://regex101.com/r/aVz4uG/13
        this.reg = /(\S+)\s*=\s*([']|[\"])([\W\w]*?)\2/g
        this.tagName = tagName
        this.attribute = Array.from(source.matchAll(this.reg)).reduce(function (context, value) {
          context[value[1]] = value[3]
          return context;
        }, {})
      }
    };

    class Node {
      constructor(path) {
        if (!path || (path && path.trim().length == 0)) {
          console.assert(false, "Node src is empty")
        }
        //status of the node
        this.isValide = true;
        this.isLoad = false;
        this.isCompletelyLoad = false;
        //value of the content
        this.path = path
        this.parent;
        this.text;
        //children 
        this.children = [];  // [node, node, node...]
        this.contentArray = []; //[string,tag,string,tag,string,tag]
        //listeners
        this.onLoadListeners = []
        this.onCompletelyLoadListeners = []
        this.onChildLoadListeners = []
      }
      addLoadListeners(fn) {
        this.onLoadListeners.push(fn)
      }
      addCompletelyLoadListeners(fn) {
        this.onCompletelyLoadListeners.push(fn)
      }
      addChildLoadListeners(fn) {
        this.onChildLoadListeners.push(fn)
      }
      removeLoadListeners(fn) {
        const index = this.onLoadListeners.findIndex(function (value) {
          return value === fn
        })
        this.onLoadListeners.splice(index, 1)
      }
      removeCompletelyLoadListeners(fn) {
        const index = this.onCompletelyLoadListeners.findIndex(function (value) {
          return value === fn
        })
        this.onCompletelyLoadListeners.splice(index, 1)
      }
      removeChildLoadListeners(fn) {
        const index = this.onChildLoadListeners.findIndex(function (value) {
          return value === fn
        })
        this.onChildLoadListeners.splice(index, 1)
      }
      getSrcArray() {
        return this.contentArray.reduce(function (context, value, index) {
          if (value instanceof Tag) {
            const src = value.attribute["src"]
            if (src != undefined) {
              context.push(src)
            }
          }
          return context;
        }, [])
      }
      toString() {
        return Node.treeToString(this)
      }
      addChild(index, src, value) {
        const childNode = new Node(src);
        childNode.text = value;
        childNode.parent = this;
        this.children[index] = childNode;
        //prevent parent nodes being their child's node
        this.pathSet.add(this.path);
        if (this.pathSet.has(src)) {
          childNode.isValide = false;
        }
        this.onChildLoad(index, childNode)
        return childNode;
      }
      onChildLoad(index, child) {
        log(`onChildLoad:${child.parent.path}->[${index}] ${child.path}`);
        this.onChildLoadListeners.forEach(function (listener) {
          listener(child, index)
        })
      }
      onCompletelyLoad(node) { //load its content and its children's content
        log("onCompletelyLoad:" + node.path);
        this.isCompletelyLoad = true;
        this.onCompletelyLoadListeners.forEach(function (listener) {
          listener(node)
        })
        Node.onCompletelyLoad(this)
      }
      //load its content, not include the content of include content
      onLoad(text) {
        //add content to the node and parse the content
        const node = this;
        node.isLoad = true;
        node.text = text;
        Node.onLoad(node)
        log("onLoad:" + node.path);
        node.contentArray = Node.parseHtml("include", node.text)
        //set tags to children
        contentArray.reduce(function(context,value,index){
          if(value instanceof Tag){
            node.children[context.i]["tag"] = value;
            context.i++
          }
          return context;
        },{i:0})
        //fire listener
        node.onLoadListeners.forEach(function (listener) {
          listener(node)
        })
        //fire completelyLoad event
        if (node.contentArray.length === 1) {//leaf Node
          Node.fireCompletelyLoad(node);
        }
      }
    }
      Node.prototype.pathSet = new Set();
      Node.fireCompletelyLoad = function (node) {
      node.onCompletelyLoad(node);
      if (node.parent) {
      const allLoad = node.parent.children.every(function (v) {
      return v.isCompletelyLoad === true;
    })
      if (allLoad) {
      Node.fireCompletelyLoad(node.parent)
    }
    }
    }
      /**
       *  node with path
       */
      Node.doInclude = function (node) {
      if (!node.isValide) {
      node.onLoad('');
    } else {
      Node.get (node.path, function (value) {
      node.onLoad(value);
      node.getSrcArray().forEach(function (src, index) {
      Node.get (src, function (value) {
      const newNode = node.addChild(index, src, value)
      Node.doInclude(newNode)
    })
    })
    })
    }
    }

      Node.get = function (path, fn) {
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
      if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
      if (fn instanceof Function)
      fn(this.responseText);
    }
    };
      xhttp.open("GET", path + "?time=" + new Date().getTime(), true);
      xhttp.send();
    }

      /**
       * [String,Tag,String,Tag,String]
       */
      Node.parseHtml = function (tagName, source) {
      //const reg = /(<include[^>]*>(.*?)<\s*\/\s*include>|<\s*include[^>]*\/\s*>)/g
      const reg = new RegExp('(<' + tagName + '[^>]*>(.*?)<\s*\/\s*' + tagName + '>|<\s*' + tagName + '[^>]*\/\s*>)', 'g')
      const result = Array.from (source.matchAll(reg)).reduce(function(context, value) {
        const matchText = value[0];
        const index = value.index;
        if (context['LastIndex'] === undefined) {
          context['LastIndex'] = 0;
        }
          context.push(new String(source.substring(context['LastIndex'], index)))
          context['LastIndex'] = index + matchText.length
          context.push(new Tag(tagName, matchText));
          return context;
        }, [])
        result.push(new String(source.substring(result['LastIndex'])))
        return result;
      };

      Node.treeToString = function (node) {
      if (!(node instanceof Node) || !node.isLoad) return ""
      let i = 0;
      return node.contentArray.reduce(function (context, value, index) {
      if (value instanceof String) {
      context.push(value)
    } else if (value instanceof Tag) {
      const child = Node.treeToString(node.children[i++]);
      context.push(child)
    } else {
      console.assert(false, "unsupported type")
    }
      return context;
    }, []).join("");
    }


    const onLoadFns = []
    Node.onLoad = function (node) {
      onLoadFns.forEach(function (fn) {
        fn(node)
      })
    }

    const onCompletelyLoadFns = []
    Node.onCompletelyLoad = function (node) {
      onCompletelyLoadFns.forEach(function (fn) {
        fn(node)
      })
    }

    /////////////////////////////////////////////
    let rootNode = null

    function load(src) {
      rootNode = new Node(src ? src : window.location.href);
      Node.doInclude(rootNode);
      return window['include']
    }
    function get(src, fn) {
      Node.get(src, fn)
      return window['include']
    }
    function addLoadListeners(fn) {
      onLoadFns.push(fn)
      return window['include']
    }
    function addCompletelyLoadListeners(fn) {
      onCompletelyLoadFns.push(fn)
      return window['include']
    }

    window['include'] = {
      get: get,
      load: load,
      addLoadListeners: addLoadListeners,
    }

    include.get("data.json", function (jsonStr) {
      const json = JSON.parse(json)
      include.load(null).addLoadListeners(function (node) {
        if(node.parent){
          if(node.tag && node.tag.attribute('data')){
            node.text = Mustache.render(node.text, json[node.tag.attribute('data')])
          }
        }else{
          node.text = Mustache.render(node.text, json);
        }
      })
    })

    rootNode.addCompletelyLoadListeners(function (node) {
      var rendered = Mustache.render(node.toString(), JSON.parse(json));
      document.write(rendered);
    })

  }
})()


