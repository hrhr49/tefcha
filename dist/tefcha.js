parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"WDTd":[function(require,module,exports) {
"use strict";var e=this&&this.__extends||function(){var e=function(n,t){return(e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,n){e.__proto__=n}||function(e,n){for(var t in n)n.hasOwnProperty(t)&&(e[t]=n[t])})(n,t)};return function(n,t){function r(){this.constructor=n}e(n,t),n.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r)}}(),n=this&&this.__assign||function(){return(n=Object.assign||function(e){for(var n,t=1,r=arguments.length;t<r;t++)for(var i in n=arguments[t])Object.prototype.hasOwnProperty.call(n,i)&&(e[i]=n[i]);return e}).apply(this,arguments)},t=this&&this.__spreadArrays||function(){for(var e=0,n=0,t=arguments.length;n<t;n++)e+=arguments[n].length;var r=Array(e),i=0;for(n=0;n<t;n++)for(var o=arguments[n],s=0,c=o.length;s<c;s++,i++)r[i]=o[s];return r};Object.defineProperty(exports,"__esModule",{value:!0}),exports.parse=void 0;var r=function(n){function t(){return null!==n&&n.apply(this,arguments)||this}return e(t,n),t}(Error),i=function(e){var n=e.lineno,t=e.msg,i=e.src,o=void 0===i?"":i,s=t;n&&n>0&&(s="at line "+n+": "+s);var c="";return o&&n>0&&(c=o.split(/\n/).map(function(e,n){return{lineno:n+1,line:e}}).slice(Math.max(0,n-1-5),n-1+5).map(function(e){var t=e.lineno,r=e.line;return(t===n?">":" ")+t+": "+r}).join("\n")),new r(s+"\n"+c)},o=["if","else","elif","while","for","do","switch","case"],s=t(o,["continue","break","pass"]),c=function(e,t){var r=[],o="";if(e.split(/\r\n|\r|\n/).forEach(function(e,n){if(n++,""!==(e=o+e).trim()){for(var i=0;e.startsWith(t.src.indentStr);)i++,e=e.slice(t.src.indentStr.length);e.startsWith(t.src.commentStr)||(e.endsWith("\\")?o=e.slice(0,-1):(o="",r.push({lineno:n,line:e,nestLevel:i})))}}),""!==o)throw i({msg:"EOF is found after '\\'"});var s=Math.min.apply(Math,r.map(function(e){return e.nestLevel}));return r=r.map(function(e){return n(n({},e),{nestLevel:e.nestLevel-s})})},l=function(e,n){var t={type:"program",lineno:0,children:[]},r=[t];return e.forEach(function(e){var t=e.lineno,c=e.line,l=e.nestLevel;if(r.length-1<l)throw i({lineno:t,src:n,msg:"unexpected indent"});for(;r.length-1>l;)r.pop();var a=r.slice(-1)[0],f=c.split(" ")[0];if(s.includes(f)){var h={type:f,lineno:t,content:c.slice(c.indexOf(" ")+1),children:[]};if(a.children.push(h),o.includes(f))"do"===(a.children.length>0?a.children.slice(-1)[0]:null).type&&"while"===f||r.push(h)}else a.children.push({type:"text",lineno:t,content:c})}),t},a=function e(n,r,o){if(n.children){var s={type:"none",lineno:-1};n.children.forEach(function(e,c){var l=e.lineno;switch(e.type){case"program":case"text":case"if":break;case"else":if(!["if","elif"].includes(s.type))throw i({lineno:l,src:o,msg:'before "else" statement, "if" or "elif" shoud exists.'});break;case"elif":if(!["if","elif"].includes(s.type))throw i({lineno:l,src:o,msg:'before "elif" statement, "if" or "elif" shoud exists.'});break;case"while":case"switch":break;case"case":if("switch"!==n.type)throw i({lineno:l,src:o,msg:'keyword "case" shoud be in "switch" statement.'});break;case"continue":if(!t(r,[n]).some(function(e){return["for","while","do"].includes(e.type)}))throw i({lineno:l,src:o,msg:'at ${lineno} "continue" statement shoud be in loop'});break;case"break":if(!t(r,[n]).some(function(e){return["for","while","do","case"].includes(e.type)}))throw i({lineno:l,src:o,msg:'"break" statement shoud be in loop or "case".'});break;case"do":if(c+1>=n.children.length||"while"!==n.children[c+1].type)throw i({lineno:l,src:o,msg:'cannot find corresponding keyword "while" to keyword "do".'});break;case"pass":break;default:throw i({lineno:l,src:o,msg:'node type "'+e.type+'" is not implemented yet.'})}s=e}),n.children.forEach(function(i){return e(i,t(r,[n]),o)})}},f=function(e,n){var t=c(e,n),r=l(t,e);return a(r,[],e),r};exports.parse=f;
},{}],"qVa1":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(i,n){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,i){t.__proto__=i}||function(t,i){for(var n in i)i.hasOwnProperty(n)&&(t[n]=i[n])})(i,n)};return function(i,n){function r(){this.constructor=i}t(i,n),i.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}(),i=this&&this.__spreadArrays||function(){for(var t=0,i=0,n=arguments.length;i<n;i++)t+=arguments[i].length;var r=Array(t),e=0;for(i=0;i<n;i++)for(var a=arguments[i],o=0,h=a.length;o<h;o++,e++)r[e]=a[o];return r};Object.defineProperty(exports,"__esModule",{value:!0}),exports.BaseShape=exports.Group=exports.Diamond=exports.Rect=exports.Text=exports.Path=exports.Point=void 0;var n=function(){return function(t){var i=this,n=t.x,r=void 0===n?0:n,e=t.y,a=void 0===e?0:e,o=t.width,h=void 0===o?0:o,x=t.height,s=void 0===x?0:x,m=t.minX,u=void 0===m?0:m,c=t.minY,p=void 0===c?0:c,d=t.maxX,v=void 0===d?0:d,y=t.maxY,f=void 0===y?0:y;this.trans=function(t,n){return i.x+=t,i.y+=n,i},this.x=r,this.y=a,this.width=h,this.height=s,this.minX=u,this.minY=p,this.maxX=v,this.maxY=f}}();exports.BaseShape=n;var r=function(i){function n(t){var r=t.x,e=t.y,a=i.call(this,{x:r,y:e})||this;return a.clone=function(){return new n({x:a.x,y:a.y})},a.type="point",a}return t(n,i),n}(n);exports.Point=r;var e=function(i){function n(t){var n=t.x,r=t.y,e=t.cmds,a=t.isArrow,o=void 0!==a&&a,h=this,x=0,s=0,m=0,u=0,c=0,p=0;return e.forEach(function(t){var i=t[0],n=t[1];"h"===i?x+=n:s+=n,m=Math.min(m,x),u=Math.min(u,s),c=Math.max(c,x),p=Math.max(p,s)}),(h=i.call(this,{x:n,y:r,minX:m,minY:u,maxX:c,maxY:p,width:c-m,height:p-u})||this).cmds=e,h.isArrow=o,h.type="path",h}return t(n,i),n.vline=function(t){var i=t.x,r=t.y,e=t.step,a=t.isArrow;return new n({x:i,y:r,cmds:[["v",e]],isArrow:void 0!==a&&a})},n.hline=function(t){var i=t.x,r=t.y,e=t.step,a=t.isArrow;return new n({x:i,y:r,cmds:[["h",e]],isArrow:void 0!==a&&a})},n}(n);exports.Path=e;var a=function(i){function n(t){var n=t.content,r=t.width,e=t.height,a=t.x,o=void 0===a?0:a,h=t.y,x=void 0===h?0:h,s=t.isLabel,m=void 0!==s&&s,u=i.call(this,{x:o,y:x,maxX:r,maxY:e,width:r,height:e})||this;return u.content=n,u.type="text",u.isLabel=m,u}return t(n,i),n.createByMeasure=function(t){var i=t.x,r=void 0===i?0:i,e=t.y,a=void 0===e?0:e,o=t.text,h=t.attrs,x=t.measureText,s=t.isLabel,m=x(o,h);return new n({content:o,x:r,y:a,width:m.width,height:m.height,isLabel:s})},n}(n);exports.Text=a;var o=function(i){function n(t){var n=t.x,r=void 0===n?0:n,e=t.y,a=void 0===e?0:e,o=t.width,h=t.height,x=i.call(this,{x:r,y:a,width:o,height:h,maxX:o,maxY:h})||this;return x.type="rect",x}return t(n,i),n}(n);exports.Rect=o;var h=function(i){function n(t){var n=t.x,r=void 0===n?0:n,e=t.y,a=void 0===e?0:e,o=t.width,h=t.height,x=i.call(this,{x:r,y:a,width:o,height:h,maxX:o,maxY:h})||this;return x.type="diamond",x}return t(n,i),n}(n);exports.Diamond=h;var x=function(n){function e(t){var e=t.x,a=t.y,o=t.children,h=n.call(this,{x:e,y:a})||this;return h.add=function(t){return h.minX=Math.min(h.minX,t.x+t.minX),h.minY=Math.min(h.minY,t.y+t.minY),h.maxX=Math.max(h.maxX,t.x+t.maxX),h.maxY=Math.max(h.maxY,t.y+t.maxY),h.width=h.maxX-h.minX,h.height=h.maxY-h.minY,h.children.push(t),h},0===o.length&&(o=i(o,[new r({x:e,y:a})])),h.minX=Math.min.apply(Math,o.map(function(t){return t.x+t.minX})),h.minY=Math.min.apply(Math,o.map(function(t){return t.y+t.minY})),h.maxX=Math.max.apply(Math,o.map(function(t){return t.x+t.maxX})),h.maxY=Math.max.apply(Math,o.map(function(t){return t.y+t.maxY})),h.width=h.maxX-h.minX,h.height=h.maxY-h.minY,h.type="group",h.children=o,h}return t(e,n),e}(n);exports.Group=x;
},{}],"P8eO":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.RangeAllocator=exports.createRangeList=void 0;var t=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];var n={start:-1/0,end:-1/0,next:null},r=n;t.forEach(function(t){var e={start:t[0],end:t[1],next:null};r.next=e,r=e});var a={start:1/0,end:1/0,next:null};return r.next=a,n};exports.createRangeList=t;var e=function(){return function t(e){var n=this;this.clone=function(){return new t(n.ref)},this.findAllocatablePosition=function(t,e){for(var r=n.ref;r.next.start<t;)r=r.next;for(var a=Math.max(t,r.end);r.next.start-a<e;)a=(r=r.next).end;return n.ref=r,a},this.allocate=function(t,e){var r=n.findAllocatablePosition(t,e),a=r+e,s=n.ref;if(s.end===r)s.next.start===a?(s.end=s.next.end,s.next=s.next.next):s.end=a;else if(s.next.start===a)s.next.start=r,n.ref=s.next;else{var o={start:r,end:a,next:s.next};s.next=o,n.ref=o}return r},this.merge=function(t,e){var r=t+e;t=Math.max(t,n.ref.start);for(var a,s=n.ref;s.next.start<=t;)s=s.next;for(t<=s.end?a=s:(a={start:t,end:t,next:s.next},s.next=a,s=a);s.next.start<=r;)s=s.next;r<=s.end?(a.end=s.end,a.next=s.next):(a.end=r,a.next=s.next),n.ref=a},this.ranges=function(){var t=[],e=n.ref;for(e.start===-1/0&&(e=e.next);e.start!==1/0;)t.push({start:e.start,end:e.end}),e=e.next;return t},this.mergeAllocator=function(t){t.ranges().forEach(function(t){var e=t.start,r=t.end;n.merge(e,r-e)})},this.ref=e}}();exports.RangeAllocator=e;
},{}],"iZAl":[function(require,module,exports) {
"use strict";var t=this&&this.__assign||function(){return(t=Object.assign||function(t){for(var e,o=1,i=arguments.length;o<i;o++)for(var n in e=arguments[o])Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n]);return t}).apply(this,arguments)},e=this&&this.__spreadArrays||function(){for(var t=0,e=0,o=arguments.length;e<o;e++)t+=arguments[e].length;var i=Array(t),n=0;for(e=0;e<o;e++)for(var r=arguments[e],a=0,h=r.length;a<h;a++,n++)i[n]=r[a];return i};Object.defineProperty(exports,"__esModule",{value:!0}),exports.Flowchart=exports.createFlowchart=void 0;var o=require("./shape"),i=require("./range_allocator"),n={while:{break:"right",continue:"left"},doWhile:{break:"right",continue:"right"},for:{break:"right",continue:"left"}},r=function(t,e){return console.assert("none"!==t),n[t][e]},a=function(){return function t(e){var o=this;void 0===e&&(e="none"),this.clone=function(){return new t(o.type)},this.type=e,this.breakPoints=[],this.continuePoints=[]}}(),h=function(){return function t(e){var n=this,r=e.shapeGroup,h=e.endPoint,s=e.measureText,c=e.config,l=e.loopInfo,p=e.leftYAllocator,f=e.rightYAllocator;this.die=function(){n.alive=!1},this.isAlive=function(){return n.alive},this.head=function(){return n.endPoint.y},this.shiftX=function(t){var e=n,o=e.shapeGroup,i=e.endPoint,r=e.loopInfo;o.trans(t,0),i.trans(t,0);var a=r.breakPoints,h=r.continuePoints;return a.forEach(function(e){return e.trans(t,0)}),h.forEach(function(e){return e.trans(t,0)}),n},this.step=function(t){return void 0===t&&(t=n.config.flowchart.stepY),n.shapeGroup.add(o.Path.vline({x:0,y:n.head(),step:t})),n.move(t),n.head()},this.stepAbs=function(t){return n.step(t-n.head()),n.head()},this.move=function(t){return void 0===t&&(t=n.config.flowchart.stepY),n.endPoint.trans(0,t),n.head()},this.moveAbs=function(t){return n.move(t-n.head()),n.head()},this.rect=function(t){var e=t.x,i=t.y,r=t.text,a=n.measureText(r,n.config.text.attrs),h=a.width,s=a.height,c=h+2*n.config.rect.padX,l=s+2*n.config.rect.padY;return n.wrapText({cls:o.Rect,text:r,x:e,y:i,width:c,height:l,textWidth:h,textHeight:s})},this.diamond=function(t){var e=t.x,i=t.y,r=t.text,a=n.measureText(r,n.config.text.attrs),h=a.width,s=a.height,c=h+s/n.config.diamond.aspectRatio,l=s+h*n.config.diamond.aspectRatio;return n.wrapText({cls:o.Diamond,text:r,x:e,y:i,width:c,height:l,textWidth:h,textHeight:s})},this.wrapText=function(t){var e=t.cls,i=t.text,r=t.x,a=t.y,h=t.width,s=t.height,c=t.textWidth,l=t.textHeight,p=n.text({text:i,x:-c/2,y:s/2-l/2}),f=new e({x:-h/2,width:h,height:s});return new o.Group({x:r,y:a,children:[p,f]})},this.text=function(t){var e=t.x,i=t.y,r=t.text;return o.Text.createByMeasure({x:e,y:i,text:r,attrs:n.config.text.attrs,measureText:n.measureText,isLabel:!1})},this.label=function(t){var e=t.x,i=t.y,r=t.text;return o.Text.createByMeasure({x:e,y:i,text:r,attrs:n.config.text.attrs,measureText:n.measureText,isLabel:!0})},this.stepAndText=function(t){var e=n.rect({x:0,y:0,text:t}),o=n.rightYAllocator.findAllocatablePosition(n.head(),e.height+n.config.flowchart.stepY);n.leftYAllocator.merge(o,e.height+n.config.flowchart.stepY),n.stepAbs(o+n.config.flowchart.stepY),e.trans(0,n.head()),n.shapeGroup.add(e),n.move(e.height)},this.stepAndDiamond=function(t){var e,o=t.content,i=t.yesDir,r=t.noDir,a=t.jumpLeft,h=void 0!==a&&a,s=(t.jumpRight,n.diamond({x:0,y:0,text:o}));h?(e=n.leftYAllocator.allocate(n.head(),s.height+n.config.flowchart.stepY),n.rightYAllocator.merge(e,s.height+n.config.flowchart.stepY)):(e=n.rightYAllocator.findAllocatablePosition(n.head(),s.height+n.config.flowchart.stepY),n.leftYAllocator.merge(e,s.height+n.config.flowchart.stepY)),n.stepAbs(e+n.config.flowchart.stepY),s.trans(0,n.head()),n.shapeGroup.add(s),n.move(s.height);var c={right:{x:s.width/2,y:s.y+s.height/2},left:{x:-s.width/2,y:s.y+s.height/2},bottom:{x:0,y:s.y+s.height}};return n.shapeGroup.add(n.label({x:c[i].x+n.config.diamond.labelMarginX,y:c[i].y+n.config.diamond.labelMarginY,text:n.config.label.yesText})),n.shapeGroup.add(n.label({x:c[r].x+n.config.diamond.labelMarginX,y:c[r].y+n.config.diamond.labelMarginY,text:n.config.label.noText})),c},this.branch=function(){return new t({shapeGroup:new o.Group({x:n.endPoint.x,y:n.endPoint.y,children:[]}),endPoint:n.endPoint.clone(),measureText:n.measureText,config:n.config,loopInfo:n.loopInfo.clone(),leftYAllocator:n.leftYAllocator.clone(),rightYAllocator:n.rightYAllocator.clone()})},this.merge=function(t){var e,o;return t.shapeGroup.children.forEach(function(e){e.trans(t.shapeGroup.x,0),n.shapeGroup.add(e)}),(e=n.loopInfo.breakPoints).push.apply(e,t.loopInfo.breakPoints),(o=n.loopInfo.continuePoints).push.apply(o,t.loopInfo.continuePoints),t.endPoint.y>n.endPoint.y&&n.moveAbs(t.endPoint.y),n},this.withLoopType=function(t,e){var o=n,r=o.loopInfo,h=o.leftYAllocator,s=o.rightYAllocator;n.loopInfo=new a(t);var c=new i.RangeAllocator(i.createRangeList()),l=new i.RangeAllocator(i.createRangeList()),p=c.clone(),f=l.clone();n.leftYAllocator=c,n.rightYAllocator=l,e();var d=n.loopInfo;return n.loopInfo=r,n.leftYAllocator=h,n.rightYAllocator=s,n.leftYAllocator.mergeAllocator(p),n.rightYAllocator.mergeAllocator(f),d},this.v=function(t){n.shapeGroup.add(o.Path.vline({x:t,y:0,step:100}))},this.h=function(t){n.shapeGroup.add(o.Path.hline({x:0,y:t,step:100}))},this.shapeGroup=r,this.endPoint=h,this.measureText=s,this.config=c,this.loopInfo=l,this.leftYAllocator=p,this.rightYAllocator=f,this.alive=!0}}();exports.Flowchart=h;var s=!1,c=function(t){return s&&console.assert(t)},l=function(t){var e=t.node,n=t.config,r=t.measureText,s=new h({shapeGroup:new o.Group({x:0,y:0,children:[]}),endPoint:new o.Point({x:0,y:n.flowchart.marginY}),measureText:r,config:n,loopInfo:new a,leftYAllocator:new i.RangeAllocator(i.createRangeList()),rightYAllocator:new i.RangeAllocator(i.createRangeList())});return p(e,s),s.shiftX(-s.shapeGroup.minX+n.flowchart.marginX),s};exports.createFlowchart=l;var p=function(t,e,i){void 0===i&&(i=!0);for(var n=0;n<t.children.length&&e.isAlive();){var a=t.children[n];switch(a.type){case"text":e.stepAndText(a.content);break;case"pass":e.step();break;case"if":for(var h=[];n<t.children.length&&"if"===t.children[n].type;)h.push(t.children[n]),n++;for(;n<t.children.length&&"elif"===t.children[n].type;)h.push(t.children[n]),n++;for(;n<t.children.length&&"else"===t.children[n].type;)h.push(t.children[n]),n++;f(h,e);continue;case"while":d(a,e);break;case"do":var s=a,c=t.children[n+1];u(s,c,e),n+=2;continue;case"break":case"continue":var l=r(e.loopInfo.type,a.type);if(i)if("right"===l){var p=e.rightYAllocator.allocate(e.head(),e.config.flowchart.stepY);e.leftYAllocator.merge(p,e.config.flowchart.stepY),e.step(p+e.config.flowchart.stepY-e.head())}else{p=e.rightYAllocator.findAllocatablePosition(e.head()+e.config.flowchart.stepY,e.config.flowchart.stepY);e.leftYAllocator.merge(p,e.config.flowchart.stepY),e.rightYAllocator.merge(p,e.config.flowchart.stepY),e.stepAbs(p)}else"right"===l?e.rightYAllocator.merge(e.head()-e.config.flowchart.stepY,e.config.flowchart.stepY):e.leftYAllocator.merge(e.head()-e.config.flowchart.stepY,e.config.flowchart.stepY);var g=e.loopInfo,x=g.breakPoints,y=g.continuePoints;"break"===a.type?x.push(new o.Point({x:0,y:e.head()})):y.push(new o.Point({x:0,y:e.head()})),e.die()}n++}},f=function t(e,i,n){if(void 0===n&&(n=!0),0!==e.length)if("else"!==e[0].type){c(["if","elif"].includes(e[0].type));var a=i.branch(),h=i.branch(),s=e[0],l={direction:"bottom",isJump:!1,shouldStep:!0},f={direction:"right",isJump:!1,shouldStep:!0};if(s.children.length>0){var d=s.children[0];if("break"===d.type||"continue"===d.type){var u=i.loopInfo.type;l={direction:r(u,d.type),isJump:!0,shouldStep:!1},f={direction:"bottom",isJump:!1,shouldStep:!0}}}if(e.length>1&&"else"===e[1].type&&e[1].children.length>0){var g=e[1].children[0];if("break"===g.type||"continue"===g.type){u=i.loopInfo.type;var x=r(u,g.type);x!==l.direction&&(f={direction:x,isJump:!0,shouldStep:!1})}}console.assert(l.direction!==f.direction);var y=i.stepAndDiamond({content:s.content,yesDir:l.direction,noDir:f.direction,jumpLeft:"left"===l.direction&&l.isJump||"left"===f.direction&&f.isJump,jumpRight:"right"===l.direction&&l.isJump||"right"===f.direction&&f.isJump});if(a.moveAbs(y[l.direction].y),p(s,a,l.shouldStep),a.shiftX(y[l.direction].x),h.moveAbs(y[f.direction].y),t(e.slice(1),h,f.shouldStep),f.isJump)h.shiftX(y[f.direction].x);else if("bottom"===l.direction){var m=Math.max(y.right.x,a.shapeGroup.maxX)+i.config.flowchart.stepX-h.shapeGroup.minX;h.shiftX(m),a.shapeGroup.add(o.Path.hline({x:y.right.x,y:y.right.y,step:h.shapeGroup.x-y.right.x}));var v=Math.max(a.head(),h.head())+i.config.flowchart.stepY;a.isAlive()&&a.stepAbs(v),h.isAlive()&&h.stepAbs(v),h.isAlive()&&a.shapeGroup.add(o.Path.hline({x:h.shapeGroup.x,y:v,step:-h.shapeGroup.x+a.shapeGroup.x,isArrow:a.isAlive()}))}else h.shiftX(y[f.direction].x);i.merge(a),i.merge(h),a.isAlive()||h.isAlive()||i.die()}else p(e[0],i,n)},d=function(i,n){c("while"===i.type);var r=n.step(),a=n.stepAndDiamond({content:i.content,yesDir:"bottom",noDir:"right"}),h=n.withLoopType("while",function(){p(i,n)}),s=h.breakPoints,l=h.continuePoints,f=e(l),d=e(s);n.isAlive()&&(n.step(),f.push(new o.Point({x:0,y:n.head()}))),d.push(new o.Point(t({},a.right)));var u=Math.min(a.left.x,n.shapeGroup.minX)-n.config.flowchart.stepX,g=Math.max(a.right.x,n.shapeGroup.maxX)+n.config.flowchart.stepX;f.sort(function(t,e){return t.y>e.y?-1:1}).forEach(function(t,e){0===e?n.shapeGroup.add(new o.Path({x:t.x,y:t.y,cmds:[["h",u-t.x],["v",r-t.y],["h",-u]],isArrow:!0})):n.shapeGroup.add(o.Path.hline({x:t.x,y:t.y,step:u-t.x,isArrow:!0}))}),n.move(),d.sort(function(t,e){return t.y<e.y?-1:1}).forEach(function(t,e){0===e?n.shapeGroup.add(new o.Path({x:t.x,y:t.y,cmds:[["h",g-a.right.x],["v",n.head()-t.y],["h",-g]]})):n.shapeGroup.add(o.Path.hline({x:t.x,y:t.y,step:g-t.x,isArrow:!0}))})},u=function(i,n,r){c("do"===i.type),c("while"===n.type);var a,h,s=r.step(),l=r.withLoopType("doWhile",function(){p(i,r)}),f=l.breakPoints,d=l.continuePoints,u=e(f),g=0;if(r.isAlive()||d.length>0){d.length>0&&(r.isAlive()?r.step():r.move(),g=r.shapeGroup.maxX+r.config.flowchart.stepX,d.sort(function(t,e){return t.y<e.y?-1:1}).forEach(function(t,e){0===e?r.shapeGroup.add(new o.Path({x:t.x,y:t.y,cmds:[["h",g-t.x],["v",r.head()-t.y],["h",-g]],isArrow:!0})):r.shapeGroup.add(o.Path.hline({x:t.x,y:t.y,step:g-t.x,isArrow:!0}))}));var x=r.stepAndDiamond({content:n.content,yesDir:"bottom",noDir:"right"});r.step(),a=Math.min(x.left.x,r.shapeGroup.minX)-r.config.flowchart.stepX,r.shapeGroup.add(new o.Path({x:0,y:r.head(),cmds:[["h",a],["v",s-r.head()],["h",-a]],isArrow:!0})),h=Math.max(x.right.x,r.shapeGroup.maxX,g)+r.config.flowchart.stepX,u.push(new o.Point(t({},x.right)))}else r.move(),h=r.shapeGroup.maxX+r.config.flowchart.stepX;r.move(),u.sort(function(t,e){return t.y<e.y?-1:1}).forEach(function(t,e){0===e?r.shapeGroup.add(new o.Path({x:t.x,y:t.y,cmds:[["h",h-t.x],["v",r.head()-t.y],["h",-h]]})):r.shapeGroup.add(o.Path.hline({x:t.x,y:t.y,step:h-t.x,isArrow:!0}))})};
},{"./shape":"qVa1","./range_allocator":"P8eO"}],"HGl0":[function(require,module,exports) {
"use strict";var t=this&&this.__assign||function(){return(t=Object.assign||function(t){for(var e,a=1,r=arguments.length;a<r;a++)for(var l in e=arguments[a])Object.prototype.hasOwnProperty.call(e,l)&&(t[l]=e[l]);return t}).apply(this,arguments)};Object.defineProperty(exports,"__esModule",{value:!0}),exports.mergeDefaultConfig=exports.defaultConfig=void 0;var e={src:{indentStr:"  ",commentStr:"#"},flowchart:{marginX:35,marginY:35,stepX:24,stepY:24},rect:{padX:12,padY:8,attrs:{stroke:"black",fill:"white","stroke-width":"2px","fill-opacity":"0%"}},diamond:{aspectRatio:.75,labelMarginX:1,labelMarginY:0,attrs:{stroke:"black",fill:"white","fill-opacity":"0%","stroke-width":"2px"}},path:{attrs:{stroke:"black",fill:"black","stroke-linecap":"square","stroke-width":"2px","fill-opacity":"0%","stroke-opacity":"100%"}},arrowHead:{size:15,attrs:{stroke:"black",fill:"black","fill-opacity":"100%","stroke-width":"0px"}},text:{attrs:{stroke:"black",fill:"black","fill-opacity":"100%","font-size":"14px","stroke-width":"0"}},label:{yesText:"Y",noText:"N",attrs:{stroke:"black",fill:"black","fill-opacity":"100%","font-size":"10px","font-weight":"lighter"}}};exports.defaultConfig=e;var a=function(a){return a?{src:t(t({},e.src),a.src||{}),flowchart:t(t({},e.flowchart),a.flowchart||{}),rect:t(t({},e.rect),a.rect||{}),diamond:t(t({},e.diamond),a.diamond||{}),path:t(t({},e.path),a.path||{}),arrowHead:t(t({},e.arrowHead),a.arrowHead||{}),text:t(t({},e.text),a.text||{}),label:t(t({},e.label),a.label||{})}:e};exports.mergeDefaultConfig=a;
},{}],"QCKC":[function(require,module,exports) {
"use strict";var e=this&&this.__assign||function(){return(e=Object.assign||function(e){for(var t,r=1,a=arguments.length;r<a;r++)for(var n in t=arguments[r])Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e}).apply(this,arguments)};Object.defineProperty(exports,"__esModule",{value:!0}),exports.render=void 0;var t=require("../parser"),r=require("../flowchart"),a=require("../config"),n=function(){return function(n){var i=this,o=n.src,s=n.config,h=n.document;this.el=function(e,t){for(var r=[],a=2;a<arguments.length;a++)r[a-2]=arguments[a];var n=i._document.createElementNS("http://www.w3.org/2000/svg",e);return Object.entries(t||{}).forEach(function(e){var t=e[0],r=e[1];return n.setAttribute("className"===t?"class":t,r.toString())}),(r||[]).forEach(function(e){return n.append(e)}),n},this.createTextSVGElement=function(e,t){var r=i.el,a=r("text",t||{});return e.split(/\\n/).forEach(function(e,n){a.append(r("tspan",{x:t.x,dy:(0===n?0:1)+"em"},e))}),a},this.measureText=function(t,r){void 0===r&&(r={});var a=i,n=a.dummySVG,o=a.createTextSVGElement,s=e(e({},r),{x:r.x||0});i._document.body.append(n);var h=o(t,s);n.append(h);var c=h.getBoundingClientRect(),d=c.width,p=c.height;return n.removeChild(h),i._document.body.removeChild(n),{width:d,height:p}},this.renderShape=function(t){var r=t.layers,a=t.shape,n=t.config,o=t.offsetX,s=void 0===o?0:o,h=t.offsetY,c=void 0===h?0:h,d=i,p=d.el,u=d.createTextSVGElement,f=d.renderShape,l=d.measureText,g=s+a.x,m=c+a.y,v=a.width,w=a.height;switch(a.type){case"group":a.children.forEach(function(e){return f({layers:r,config:n,shape:e,offsetX:g,offsetY:m})});break;case"text":r.textLayer.append(u(a.content,e({x:g,y:m+l("A",a.isLabel?n.label.attrs:n.text.attrs).height/2,"dominant-baseline":"central"},a.isLabel?n.label.attrs:n.text.attrs)));break;case"path":var y="M "+g+" "+m,x=a.cmds.map(function(e){return e.join(" ")}).join(" ");r.pathLayer.append(p("path",e(e({d:y+" "+x},a.isArrow?{"marker-end":"url(#arrow-head)"}:{}),n.path.attrs)));break;case"rect":r.nodeLayer.append(p("rect",e({x:g,y:m,width:v,height:w},n.rect.attrs)));break;case"diamond":r.nodeLayer.append(p("polygon",e({points:g+v/2+","+m+", "+(g+v)+","+(m+w/2)+" "+(g+v/2)+","+(m+w)+" "+g+","+(m+w/2)},n.diamond.attrs)))}},this.render=function(){var n=i,o=n.src,s=n.config,h=n.el,c=n.measureText,d=n.renderShape;s=a.mergeDefaultConfig(s);var p=i.el("svg"),u=h("defs",null,h("marker",{id:"arrow-head",markerUnits:"userSpaceOnUse",markerWidth:""+s.arrowHead.size,markerHeight:""+2*s.arrowHead.size,viewBox:"0 0 10 10",refX:"10",refY:"5",orient:"auto-start-reverse"},h("polygon",e({points:"0,0 0,10 10,5",class:"arrow-head"},s.arrowHead.attrs))));p.append(u);var f=h("g"),l=h("g"),g=h("g"),m=r.createFlowchart({node:t.parse(o,s),config:s,measureText:c});return d({layers:{pathLayer:f,nodeLayer:l,textLayer:g},shape:m.shapeGroup,config:s}),p.append(f),p.append(l),p.append(g),p.setAttribute("width",(m.shapeGroup.width+2*s.flowchart.marginX).toString()),p.setAttribute("height",(m.shapeGroup.height+2*s.flowchart.marginY).toString()),p},this._document=h,this.src=o,this.config=e(e({},a.defaultConfig),s),this.dummySVG=this.el("svg")}}(),i=function(e){return new n(e).render()};exports.render=i;
},{"../parser":"WDTd","../flowchart":"iZAl","../config":"HGl0"}],"ZCfc":[function(require,module,exports) {
"use strict";var e=this&&this.__spreadArrays||function(){for(var e=0,t=0,r=arguments.length;t<r;t++)e+=arguments[t].length;var n=Array(e),a=0;for(t=0;t<r;t++)for(var o=arguments[t],i=0,c=o.length;i<c;i++,a++)n[a]=o[i];return n};Object.defineProperty(exports,"__esModule",{value:!0});var t=require("../renderer/svg"),r={initialize:function(r){e(document.getElementsByClassName("tefcha")).forEach(function(e){var n=e.textContent;e.textContent="",e.append(t.render({src:n,document:document,config:r}))})}};window.tefcha=r;
},{"../renderer/svg":"QCKC"}]},{},["ZCfc"], null)
//# sourceMappingURL=/tefcha.js.map