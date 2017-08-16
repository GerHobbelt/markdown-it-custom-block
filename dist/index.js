'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var embedRE = /@\[([\w-]+)\](?:\((.+)\))?/im;

module.exports = function plugin(md, options) {
  md.renderer.rules.custom = function tokenizeBlock(tokens, idx) {
    var _tokens$idx$info = tokens[idx].info,
        tag = _tokens$idx$info.tag,
        arg = _tokens$idx$info.arg;

    if (!tag || !options[tag]) return '';
    return options[tag](arg) + '\n';
  };

  md.block.ruler.before('fence', 'custom', function customEmbed(state, startLine, endLine, silent) {
    var startPos = state.bMarks[startLine] + state.tShift[startLine];
    var maxPos = state.eMarks[startLine];
    var block = state.src.slice(startPos, maxPos);
    var pointer = { line: startLine, pos: startPos

      // XXX wtf
    };if (startLine !== 0) {
      var prevLineStartPos = state.bMarks[startLine - 1] + state.tShift[startLine - 1];
      var prevLineMaxPos = state.eMarks[startLine - 1];
      if (prevLineMaxPos > prevLineStartPos) return false;
    }

    // Check if it's @[tag](arg)
    if (state.src.charCodeAt(pointer.pos) !== 0x40 /* @ */ || state.src.charCodeAt(pointer.pos + 1) !== 0x5B /* [ */) {
        return false;
      }

    var match = embedRE.exec(block);

    if (!match || match.length < 3) {
      return false;
    }

    var _match = _slicedToArray(match, 3),
        all = _match[0],
        tag = _match[1],
        arg = _match[2];

    pointer.pos += all.length;

    // Block embed must be at end of input or the next line must be blank.
    // TODO something can be done here to make it work without blank lines
    if (endLine !== pointer.line + 1) {
      var nextLineStartPos = state.bMarks[pointer.line + 1] + state.tShift[pointer.line + 1];
      var nextLineMaxPos = state.eMarks[pointer.line + 1];
      if (nextLineMaxPos > nextLineStartPos) return false;
    }

    if (pointer.line >= endLine) return false;

    if (!silent) {
      var token = state.push('custom', 'div', 0);
      token.markup = state.src.slice(startPos, pointer.pos);
      token.info = { arg: arg, tag: tag };
      token.block = true;
      token.map = [startLine, pointer.line + 1];
      state.line = pointer.line + 1;
    }

    return true;
  }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
};