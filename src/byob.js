/*

    byob.js

    "build your own blocks" for Snap!
    based on morphic.js, widgets.js blocks.js, threads.js and objects.js
    inspired by Scratch

    written by Jens Mönig
    jens@moenig.org

    Copyright (C) 2025 by Jens Mönig

    This file is part of Snap!.

    Snap! is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of
    the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.


    prerequisites:
    --------------
    needs blocks.js, threads.js, objects.js, widgets.js and morphic.js


    hierarchy
    ---------
    the following tree lists all constructors hierarchically,
    indentation indicating inheritance. Refer to this list to get a
    contextual overview:

    BlockLabelFragment
    CustomBlockDefinition

    CommandBlockMorph***
        CustomCommandBlockMorph
        HatBlockMorph***
            CustomHatBlockMorph
            PrototypeHatBlockMorph

    DialogBoxMorph**
        BlockDialogMorph
        BlockEditorMorph
        BlockExportDialogMorph
        BlockImportDialogMorph
        BlockRemovalDialogMorph
        BlockVisibilityDialogMorph
        InputSlotDialogMorph
        VariableDialogMorph

    Morph*
        BlockLabelFragmentMorph
        BlockLabelPlaceHolderMorph

    ReporterBlockMorph***
        CustomReporterBlockMorph
        JaggedBlockMorph

    TemplateSlotMorph***
        BlockInputFragmentMorph

    * from morphic.js
    ** from widgets.js
    *** from blocks.js


    toc
    ---
    the following list shows the order in which all constructors are
    defined. Use this list to locate code in this document:

    CustomBlockDefinition
    CustomCommandBlockMorph
    CustomReporterBlockMorph
    JaggedBlockMorph
    BlockDialogMorph
    BlockEditorMorph
    PrototypeHatBlockMorph
    BlockLabelFragmentMorph
    BlockLabelPlaceHolderMorph
    BlockInputFragmentMorph
    InputSlotDialogMorph
    VariableDialogMorph
    BlockExportDialogMorph
    BlockImportDialogMorph
    BlockRemovalDialogMorph
    BlockVisibilityDialogMorph

*/

/*global modules, CommandBlockMorph, SpriteMorph, TemplateSlotMorph, Map, Morph,
StringMorph, Color, DialogBoxMorph, ScriptsMorph, ScrollFrameMorph, WHITE, copy,
Point, HandleMorph, HatBlockMorph, BlockMorph, detect, List, Process, isString,
AlignmentMorph, ToggleMorph, InputFieldMorph, ReporterBlockMorph, StringMorph,
nop, radians, BoxMorph, ArrowMorph, PushButtonMorph, contains, InputSlotMorph,
ToggleButtonMorph, IDE_Morph, MenuMorph, ToggleElementMorph, fontHeight, isNil,
StageMorph, SyntaxElementMorph, CommentMorph, localize, CSlotMorph, Variable,
MorphicPreferences, SymbolMorph, CursorMorph, VariableFrame, BooleanSlotMorph,
WatcherMorph, XML_Serializer, SnapTranslator, SnapExtensions, ColorSlotMorph,
ArgLabelMorph, embedMetadataPNG, ArgMorph, RingMorph, InputList, MultiArgMorph*/

/*jshint esversion: 11*/

// Global stuff ////////////////////////////////////////////////////////

modules.byob = '2025-April-16';

// Declarations

var CustomBlockDefinition;
var CustomCommandBlockMorph;
var CustomHatBlockMorph;
var CustomReporterBlockMorph;
var BlockDialogMorph;
var BlockEditorMorph;
var PrototypeHatBlockMorph;
var BlockLabelFragment;
var BlockLabelFragmentMorph;
var BlockInputFragmentMorph;
var BlockLabelPlaceHolderMorph;
var InputSlotDialogMorph;
var VariableDialogMorph;
var JaggedBlockMorph;
var BlockExportDialogMorph;
var BlockImportDialogMorph;
var BlockRemovalDialogMorph;
var BlockVisibilityDialogMorph;

// CustomBlockDefinition ///////////////////////////////////////////////

// CustomBlockDefinition instance creation:

function CustomBlockDefinition(spec, receiver) {
    this.body = null; // a Context (i.e. a reified top block)
    this.scripts = [];
    this.category = null;
    this.isGlobal = false;
    this.type = 'command';
    this.spec = spec || '';
    this.declarations = new Map();
        //  key: inputName
        //  value: [
        //      type,
        //      default,
        //      options,
        //      isReadOnly,
        //      isIrreplaceable,
        //      separator,
        //      collapse,
        //      expand,
        //      initialSlots,
        //      minSlots,
        //      maxSlots
        //  ]
    this.variableNames = [];
    this.comment = null;
    this.isHelper = false;
    this.spaceAbove = false; // support grouping templates in the palette
    this.codeMapping = null; // generate text code
    this.codeHeader = null; // generate text code
    this.translations = {}; // format: {lang : spec}

    // allow libraries to overload primitives with global custom blocks
    this.selector = null;
    this.primitive = null;

    // allow hat blocks to distinguish between "events" (default) and "rules"
    this.semantics = null;

    // don't serialize (not needed for functionality):
    this.receiver = receiver || null; // for serialization only (pointer)
    this.editorDimensions = null; // a rectangle, last bounds of the editor
    this.cachedIsRecursive = null; // for automatic yielding
    this.cachedTranslation = null; // for localized block specs

	// transient - for "wishes"
 	this.storedSemanticSpec = null;
}

// CustomBlockDefinition instantiating blocks

CustomBlockDefinition.prototype.blockInstance = function (storeTranslations) {
    var block;
    if (this.type === 'command') {
        block = new CustomCommandBlockMorph(this);
    } else if (this.type === 'hat') {
        block = new CustomHatBlockMorph(this);
    } else {
        block = new CustomReporterBlockMorph(
            this,
            this.type === 'predicate'
        );
    }
    block.isDraggable = true;
    if (storeTranslations) { // only for "wishes"
    	block.storedTranslations = this.translationsAsText();
    }
    return block;
};

CustomBlockDefinition.prototype.templateInstance = function () {
    var block;
    block = this.blockInstance();
    block.refreshDefaults(this);
    block.isDraggable = false;
    block.isTemplate = true;
    return block;
};

CustomBlockDefinition.prototype.prototypeInstance = function () {
    var block, slot;

    // make a new block instance and mark it as prototype
    if (this.type === 'command') {
        block = new CustomCommandBlockMorph(this, true);
    } else if (this.type === 'hat') {
        block = new CustomHatBlockMorph(this, true);
    } else {
        block = new CustomReporterBlockMorph(
            this,
            this.type === 'predicate',
            true
        );
    }

    // assign slot declarations to prototype inputs
    block.parts().forEach(part => {
        if (part instanceof BlockInputFragmentMorph) {
            slot = this.declarations.get(part.fragment.labelString);
            if (slot) {
                part.fragment.type = slot[0];
                part.fragment.defaultValue = slot[1];
                part.fragment.options = slot[2];
                part.fragment.isReadOnly = slot[3] || false;
                part.fragment.isIrreplaceable = slot[4] || false;
                part.fragment.separator = slot[5] || null;
                part.fragment.collapse = slot[6] || null;
                part.fragment.expand = slot[7] || null;
                part.fragment.initialSlots = slot[8] || 0;
                part.fragment.minSlots = slot[9] || 0;
                part.fragment.maxSlots = slot[10] || 0;
            }
        }
    });

    return block;
};

// CustomBlockDefinition duplicating

CustomBlockDefinition.prototype.copyAndBindTo = function (sprite, headerOnly) {
    var c = copy(this);

    delete c[XML_Serializer.prototype.idProperty];
    c.receiver = sprite; // only for (kludgy) serialization

    // copy declarations
    c.declarations = new Map();
    for (var [key, val] of this.declarations) {
        c.declarations.set(key, val);
    }

    if (headerOnly) { // for serializing inherited method signatures
        c.body = null;
        return c;
    }
    if (c.body) {
        c.body = Process.prototype.reify.call(
            null,
            this.body.expression,
            new List(this.inputNames())
        );
        c.body.outerContext = null;
    }

    // deep copy scripts
    c.scripts = this.scripts.map(each => each instanceof CommentMorph ?
        each : each.fullCopy());

    return c;
};

// CustomBlockDefinition accessing

CustomBlockDefinition.prototype.blockSpec = function () {
	if (this.storedSemanticSpec) {
 		return this.storedSemanticSpec; // for "wishes"
 	}

    var ans = [],
        parts = this.parseSpec(this.spec),
        spec;
    parts.forEach(part => {
        if (part[0] === '%' && part.length > 1) {
            spec = this.typeOf(part.slice(1));
        } else if (part === '$nl') {
            spec = '%br';
        } else {
            spec = part;
        }
        ans.push(spec);
        ans.push(' ');
    });
    return ''.concat.apply('', ans).trim();
};

CustomBlockDefinition.prototype.helpSpec = function () {
    var ans = [],
        parts = this.parseSpec(this.spec);
    parts.forEach(part => {
        if (part[0] !== '%') {
            ans.push(part);
        }
    });
    return ''.concat.apply('', ans).replace(/\?/g, '');
};

CustomBlockDefinition.prototype.typeOf = function (inputName) {
    if (this.declarations.has(inputName)) {
        return this.declarations.get(inputName)[0];
    }
    return '%s';
};

CustomBlockDefinition.prototype.defaultValueOf = function (inputName) {
    var def;
    if (this.declarations.has(inputName)) {
        def = this.declarations.get(inputName)[1];
        if (isString(def)) {
            if (def.length > 2 && def.startsWith('$_') && !def.includes('\n')) {
                // selector - can be translated later
                return [def.slice(2)];
            }
            return this.selector ? localize(def) : def;
        }
        return def;
    }
    return '';
};

CustomBlockDefinition.prototype.defaultValueOfInputIdx = function (idx) {
    var inputName = this.inputNames()[idx];
    return this.defaultValueOf(inputName);
};

CustomBlockDefinition.prototype.dropDownMenuOfInputIdx = function (idx) {
    var inputName = this.inputNames()[idx];
    return this.dropDownMenuOf(inputName);
};

CustomBlockDefinition.prototype.isReadOnlyInputIdx = function (idx) {
    var inputName = this.inputNames()[idx];
    return this.isReadOnlyInput(inputName);
};

CustomBlockDefinition.prototype.inputOptionsOfIdx = function (idx) {
    var inputName = this.inputNames()[idx];
    return this.inputOptionsOf(inputName);
};

CustomBlockDefinition.prototype.isIrreplaceableInputIdx = function (idx) {
    var inputName = this.inputNames()[idx];
    return this.isIrreplaceableInput(inputName);
};

CustomBlockDefinition.prototype.separatorOfInputIdx = function (idx) {
    var inputName = this.inputNames()[idx];
    return this.separatorOfInput(inputName);
};

CustomBlockDefinition.prototype.collapseOfInputIdx = function (idx) {
    var inputName = this.inputNames()[idx];
    return this.collapseOfInput(inputName);
};

CustomBlockDefinition.prototype.expandOfInputIdx = function (idx) {
    var inputName = this.inputNames()[idx];
    return this.expandOfInput(inputName);
};

CustomBlockDefinition.prototype.initialSlotsOfInputIdx = function (idx) {
    var inputName = this.inputNames()[idx];
    return this.initialSlotsOfInput(inputName);
};

CustomBlockDefinition.prototype.minSlotsOfInputIdx = function (idx) {
    var inputName = this.inputNames()[idx];
    return this.minSlotsOfInput(inputName);
};

CustomBlockDefinition.prototype.maxSlotsOfInputIdx = function (idx) {
    var inputName = this.inputNames()[idx];
    return this.maxSlotsOfInput(inputName);
};

CustomBlockDefinition.prototype.dropDownMenuOf = function (inputName) {
    var options, fname;
    if (this.declarations.has(inputName)) {
        options = this.declarations.get(inputName)[2];
        if (options && isString(options)) {
            if (options.startsWith('§_')) {
                fname = options.slice(2);
                if (contains(
                    [
                        'dynamicMenu',
                        'messagesMenu',
                        'messagesReceivedMenu', // for backward (5.0.0 - 5.0.3) support
                        'objectsMenu',
                        'costumesMenu',
                        'soundsMenu',
                        'getVarNamesDict',
                        'pianoKeyboardMenu',
                        'directionDialMenu',
                        'destinationsMenu',
                        'locationMenu',
                        'typesMenu',
                        'objectsMenuWithSelf',
                        'clonablesMenu',
                        'clonablesMenuWithTurtle',
                        'collidablesMenu',
                        'keysMenu',
                        'gettablesMenu',
                        'attributesMenu',
                        'audioMenu',
                        'scenesMenu',
                        'primitivesMenu',
                        'extensionsMenu',
                        'inputSlotsMenu'
                    ],
                    fname
                ) || fname.indexOf('ext_') === 0) {
                    return fname;
                }
            }
            return this.parseChoices(options);
        }
    }
    return null;
};

CustomBlockDefinition.prototype.parseChoices = function (string) {
    var dict = {},
        stack = [dict],
        params, body, key, val;
    if (string.match(/^function\s*\(.*\)\s*{.*\n/)) {
        // It's a JS function definition.
        // Let's extract its params and body, and return a Function out of them.
        params = string.match(/^function\s*\((.*)\)/)[1].split(',');
        body = string.split('\n').slice(1,-1).join('\n');
        return Function.apply(null, params.concat([body]));
    }
    string.split('\n').forEach(line => {
        var pair = line.split('=');
        if (pair[0] === '}') {
            stack.pop();
            dict = stack[stack.length - 1];
        } else if (pair[1] === '{') {
            dict = {};
            stack[stack.length - 1][pair[0]] = dict;
            stack.push(dict);
        } else {
            // support translating custom drop-downs by prefixing items w/ "$_"
            key = pair[0];
            if (isString(key) && key.length > 2 && key.startsWith('$_')) {
                key = localize(key.slice(2));
            }
            val = pair[1];
            if (isString(val) && val.length > 2 && val.startsWith('$_')) {
                val = [val.slice(2)];
            }
            if (isNil(val)) {
                if (key === '~') {
                    key = '~'.repeat(
                        Object.keys(dict).filter(each => each.startsWith('~')
                    ).length + 1);
                }
                dict[key] = key;
            } else {
                dict[key] = val;
            }
        }
    });
    return dict;
};

CustomBlockDefinition.prototype.encodeChoices = function (list) {
    // answer a string representing a parseable dropdown menu for an input slot
    var encode = (dta) => dta instanceof List ?
            encodeList(dta) : dta.toString(),
        encodeList = (dta) => dta.length() === 2 ? encodePair(dta)
            : dta.itemsArray().reduce(
                (a, b) => encode(a) + '\n' + encode(b)),
        encodePair = (dta) => encode(dta.at(1)) + '=' +
            (dta.at(2) instanceof List ?
                encodeSub(dta.at(2))
                : encode(dta.at(2))),
        encodeSub = (dta) => '{\n' + encode(dta) + '\n}';

    if (list.isEmpty()) {
        return '';
    }
    return list.itemsArray().reduce((a, b) => encode(a) + '\n' + encode(b));
};

CustomBlockDefinition.prototype.decodeChoices = function (choices) {
    // answer a (nested) List representing the input slot dropdown menu
    if (isNil(choices)) {return null; }
    var list = new List(),
        key;
    for (key in choices) {
        if (Object.prototype.hasOwnProperty.call(choices, key)) {
            if (key[0] === '~') {
                list.add(key[0]);
            } else if (choices[key] instanceof Object &&
                    !(choices[key] instanceof Array) &&
                    (typeof choices[key] !== 'function')) {
                list.add(new List([key, this.decodeChoices(choices[key])]));
            } else if (choices[key] instanceof Array &&
                    isString(choices[key][0])) {
                list.add(new List([key, '$_' + choices[key][0]]));
            } else if (choices[key] instanceof Array &&
                    choices[key][0] instanceof Object &&
                    typeof choices[key][0] !== 'function') {
                list.add(new List([key, this.decodeChoices(choices[key][0])]));
            } else {
                list.add(choices[key] === key ? key
                    : new List([key, choices[key]])
                );
            }
        }
    }
    return list;
};

CustomBlockDefinition.prototype.menuSearchWords = function () {
    // return a single string containing words that can be searched for
    // inside my dropdown menus
    var terms = [];
    this.inputNames().forEach(slot => {
        var menu = this.dropDownMenuOf(slot);
        if (menu) {
            if (isString(menu)) { // special menu, translates its values
                if (typeof InputSlotMorph.prototype[menu] === 'function') {
                    // catch typos in extension menus
                    menu = InputSlotMorph.prototype[menu](true);
                    terms.push(
                        Object.values(menu).map(entry => {
                            if (isNil(entry)) {return ''; }
                            if (entry instanceof Array) {
                                return localize(entry[0]);
                            }
                            return entry.toString();
                        }).join(' ')
                    );
                }
            } else { // assume a dictionary, take its keys
                terms.push(Object.keys(menu).join(' '));
            }
        }
    });
    return terms.join(' ').toLowerCase();
};

CustomBlockDefinition.prototype.isReadOnlyInput = function (inputName) {
    return this.declarations.has(inputName) &&
        this.declarations.get(inputName)[3] === true;
};

CustomBlockDefinition.prototype.isIrreplaceableInput = function (inputName) {
    return this.declarations.has(inputName) &&
        this.declarations.get(inputName)[4] === true;
};

CustomBlockDefinition.prototype.separatorOfInput = function (inputName) {
    if (this.declarations.has(inputName)) {
        return this.declarations.get(inputName)[5] || null;
    }
    return null;
};

CustomBlockDefinition.prototype.collapseOfInput = function (inputName) {
    if (this.declarations.has(inputName)) {
        return this.declarations.get(inputName)[6] || null;
    }
    return null;
};

CustomBlockDefinition.prototype.expandOfInput = function (inputName) {
    if (this.declarations.has(inputName)) {
        return this.declarations.get(inputName)[7] || null;
    }
    return null;
};

CustomBlockDefinition.prototype.initialSlotsOfInput = function (inputName) {
    if (this.declarations.has(inputName)) {
        return this.declarations.get(inputName)[8] || null;
    }
    return null;
};

CustomBlockDefinition.prototype.minSlotsOfInput = function (inputName) {
    if (this.declarations.has(inputName)) {
        return this.declarations.get(inputName)[9] || null;
    }
    return null;
};

CustomBlockDefinition.prototype.maxSlotsOfInput = function (inputName) {
    if (this.declarations.has(inputName)) {
        return this.declarations.get(inputName)[10] || null;
    }
    return null;
};

CustomBlockDefinition.prototype.inputOptionsOf = function (inputName) {
    return [
        this.dropDownMenuOf(inputName),
        this.isReadOnlyInput(inputName)
    ];
};

CustomBlockDefinition.prototype.inputNames = function () {
    var vNames = [],
        parts = this.parseSpec(this.spec);
    parts.forEach(part => {
        if (part[0] === '%' && part.length > 1) {
            vNames.push(part.slice(1));
        }
    });
    return vNames;
};

CustomBlockDefinition.prototype.parseSpec = function (spec) {
    // private
    var parts = [], word = '', i, quoted = false, c;
    for (i = 0; i < spec.length; i += 1) {
        c = spec[i];
        if (c === "'") {
            quoted = !quoted;
        } else if (c === ' ' && !quoted) {
            parts.push(word);
            word = '';
        } else {
            word = word.concat(c);
        }
    }
    parts.push(word);
    return parts;
};

CustomBlockDefinition.prototype.isDirectlyRecursive = function () {
    var myspec;
    if (this.cachedIsRecursive !== null) {
        return this.cachedIsRecursive;
    }
    if (!this.body) {
        this.cachedIsRecursive = false;
    } else {
        myspec = this.blockSpec();
        this.cachedIsRecursive = this.body.expression.anyChild(
            function (morph) {
                return morph.isCustomBlock &&
                    morph.blockSpec === myspec;
            }
        );
    }
    return this.cachedIsRecursive;
};

CustomBlockDefinition.prototype.setPrimitive = function (prim) {
    if (isString(prim) &&
            !Object.keys(SpriteMorph.prototype.blocks).includes(prim)) {
        // console.warn('attempted to set unlisted primitive:', prim);
        return;
    }
    this.primitive = prim;
};

// CustomBlockDefinition localizing

CustomBlockDefinition.prototype.localizedSpec = function () {
    if (this.selector) {
        return BlockMorph.prototype.localizeBlockSpec(this.blockSpec());
    }
	if (this.cachedTranslation) {
        return this.cachedTranslation;
    }

	var loc = this.translations[SnapTranslator.language],
		sem = this.blockSpec(),
        locParts,
  		inputs,
    	i = -1;

	function isInput(str) {
    	return (str.length > 1) && (str[0] === '%');
 	}

    if (isNil(loc)) {return sem; }
    inputs = BlockMorph.prototype.parseSpec(sem).filter(str => isInput(str));
	locParts = BlockMorph.prototype.parseSpec(loc);

	// perform a bunch of sanity checks on the localized spec
	if (locParts.some(str => isInput(str)) ||
 			(locParts.filter(str => str === '_').length !== inputs.length)
    ) {
 		this.cachedTranslation = sem;
    } else {
		// substitute each input place holder with its semantic spec part
		locParts = locParts.map(str => {
			if (str === '_') {
  				i += 1;
  				return inputs[i];
  			}
    		return str;
		});
 		this.cachedTranslation = locParts.join(' ');
   	}
  	return this.cachedTranslation;
};

CustomBlockDefinition.prototype.abstractBlockSpec = function () {
	// answer the semantic block spec substituting each input
 	// with an underscore
    return BlockMorph.prototype.parseSpec(this.blockSpec()).map(str =>
        str === '%br' ? '$nl' : (str.length > 1 && (str[0]) === '%') ? '_' : str
    ).join(' ');
};

CustomBlockDefinition.prototype.translationsAsText = function () {
	var txt = '';
	Object.keys(this.translations).forEach(lang =>
 		txt += (lang + ':' + this.translations[lang] + '\n')
    );
    return txt;
};

CustomBlockDefinition.prototype.updateTranslations = function (text) {
	var lines = text.split('\n').filter(txt => txt.length);
	this.translations = {};
 	lines.forEach(txt => {
  		var idx = txt.indexOf(':'),
    		key = txt.slice(0, idx).trim(),
      		val = txt.slice(idx + 1).trim();
    	if (idx) {
     		this.translations[key] = val;
     	}
    });
};

// CustomBlockDefinition API

CustomBlockDefinition.prototype.setBlockLabel = function (abstractSpec) {
    // private - only to be called from a Process that also does housekeeping
    // abstract block specs replace the inputs with underscores,
    // e.g. "move _ steps", "say _", "_ + _"
    var parts = abstractSpec.split(' ').filter(each =>
            each.length && each !== ' '),
        count = parts.filter(each => each === '_').length,
        inputNames = this.inputNames(),
        spec = '',
        idx = 0;

    if (!inputNames.length && count) {
        // add generic inputNames to match the number of label placeholders
        this.addInputs(count);
        inputNames = this.inputNames();
    }

    if (count !== inputNames.length) {
        throw new Error('expecting the number of inputs to match');
    }
    parts.forEach(part => {
        if (part === '_') {
            spec += inputNames[idx] ? '%\'' + inputNames[idx] + '\' ' : '';
            idx += 1;
        } else {
            spec += (part + ' ');
        }
    });
    this.spec = spec.trim();
};

CustomBlockDefinition.prototype.setBlockDefinition = function (aContext) {
    // private - only to be called from a Process that also does housekeeping
    var oldInputs = this.inputNames(),
        newInputs = aContext.inputs,
        declarations = this.declarations,
        parts = [],
        body = aContext,
        idx = 0,
        reportBlock,
        spec;

    // remove excess inputs or add missing ones
    this.addInputs(newInputs.length - oldInputs.length);
    spec = this.abstractBlockSpec();
    oldInputs = this.inputNames();

    // change the input names in the spec to those of the given context
    parts = spec.split(' ').filter(each => each.length && each !== ' ');
    spec = '';
    parts.forEach(part => {
        if (part === '_') {
            spec += newInputs[idx] ? '%\'' + newInputs[idx] + '\' ' : '';
            idx += 1;
        } else {
            spec += (part + ' ');
        }
    });
    this.spec = spec.trim();

    // change the input names in the slot declarations to those of the context
    // copy declarations
    this.declarations = new Map();
    for (var [key, val] of declarations) {
        this.declarations.set(newInputs[oldInputs.indexOf(key)], val);
    }

    // associate / disassociate the definition with a primitive
    if (body.expression?.selector === 'doPrimitive' &&
        body.expression.inputs()[0].value
    ) {
        this.setPrimitive(body.expression.inputs()[1].contents().text || null);
    } else {
        this.primitive = null;
    }

    // replace the definition body with the given context
    if (!body.expression || body.expression instanceof Array) {
        this.body = null;
        return;
    } else if (body.expression instanceof ReporterBlockMorph) {
        // turn reporter epressions into a command stack with "report"
        body = copy(aContext);
        reportBlock = SpriteMorph.prototype.blockForSelector('doReport');
        reportBlock.replaceInput(
            reportBlock.inputs()[0],
            body.expression.fullCopy()
        );
        body.expression = reportBlock;
    }
    this.body = body;
};

CustomBlockDefinition.prototype.addInputs = function (count) {
    // private - only to be called from a Process that also does housekeeping
    var inputNames, i;

    if (count === 0) {
        return;
    } else if (count < 0) {
        return this.removeInputs(-count);
    }

    inputNames = this.inputNames();

    // create gensyms
    for (i = 0; i < count; i += 1) {
        inputNames.push(this.gensym(inputNames));
    }

    // add gensyms to the spec
    this.spec = this.parseSpec(this.spec).concat(
        inputNames.slice(-count).map(str => '%' + str)
    ).join(' ').trim();

    // add slot declarations for the gensyms
    inputNames.slice(-count).forEach(name =>
        this.declarations.set(name, ['%s'])
    );
};

CustomBlockDefinition.prototype.removeInputs = function (count) {
    // private - only to be called from a Process that also does housekeeping
    var surplus = this.inputNames().slice(-count);

    // remove the surplus input names from the spec
    this.spec = this.parseSpec(this.spec).filter(str =>
        !(str.length > 1 && (str[0]) === '%' && surplus.includes(str.slice(1)))
    ).join(' ').trim();

    // remove the surplus input names from the slot declarations
    surplus.forEach(name => this.declarations.delete(name));
};

CustomBlockDefinition.prototype.gensym = function (existing) {
    var count = 1;
    while (contains(existing, '#' + count)) {
        count += 1;
    }
    return '#' + count;
};

// CustomBlockDefinition picturing

CustomBlockDefinition.prototype.scriptsPicture = function () {
    return this.scriptsModel().scriptsPicture();
};

CustomBlockDefinition.prototype.sortedElements = function () {
    return this.scriptsModel().sortedElements();
};

CustomBlockDefinition.prototype.scriptsModel = function () {
    // answer a restored scripting area for the sake
    // of creating script pictures
    var scripts, proto, block, comment, template;

    scripts = new ScriptsMorph();
    scripts.cleanUpMargin = 10;
    proto = new PrototypeHatBlockMorph(this);
    proto.setPosition(scripts.position().add(10));
    if (this.comment !== null) {
        comment = this.comment.fullCopy();
        proto.comment = comment;
        comment.block = proto;
    }
    if (this.body !== null) {
        proto.nextBlock(this.body.expression.fullCopy());
    }
    scripts.add(proto);
    proto.fixBlockColor(null, true);
    this.scripts.forEach(element => {
        block = element.fullCopy();
        block.setPosition(scripts.position().add(element.position()));
        scripts.add(block);
        if (block instanceof BlockMorph) {
            block.allComments().forEach(comment =>
                comment.align(block)
            );
        }
    });
    proto.allComments().forEach(comment =>
        comment.align(proto)
    );
    template = proto.parts()[0];
    template.fixLayout();
    template.forceNormalColoring();
    template.fixBlockColor(proto, true);
    scripts.fixMultiArgs();
    return scripts;
};

// CustomBlockDefinition purging deleted blocks

CustomBlockDefinition.prototype.purgeCorpses = function () {
    // remove blocks that have been marked for deletion
    if (this.body && this.body.expression.isCorpse) {
        this.body = null;
    }
    this.scripts = this.scripts.filter(topBlock =>
        !topBlock.isCorpse
    );
};

// CustomBlockDefinition dependencies

CustomBlockDefinition.prototype.collectDependencies = function (
    excluding,
    result,
    localReceiver // optional when exporting sprite-local blocks
) {
    if (!this.isGlobal && !localReceiver) {
        throw new Error('cannot collect dependencies for local\n' +
            'custom blocks of an unspecified sprite');
    }
    excluding.push(this);
    this.scripts.concat(
        this.body ? [this.body.expression] : []
    ).forEach(script => {
        script.forAllChildren(morph => {
            var def;
            if (morph.isCustomBlock) {
                def = morph.isGlobal ? morph.definition
                    : localReceiver.getMethod(morph.blockSpec);
                if (!contains(excluding, def) && !contains(result, def)) {
                    result.push(def);
                    def.collectDependencies(
                        excluding,
                        result,
                        localReceiver
                    );
                }
            }
        });
    });
    return result;
};

CustomBlockDefinition.prototype.isSending = function (message, receiverName) {
    return this.scripts.concat(
        this.body ? [this.body.expression] : []
    ).some(script => script instanceof BlockMorph &&
        script.isSending(message, receiverName)
    );
};

CustomBlockDefinition.prototype.dataDependencies = function () {
    // return an array of variable names referenced in this custom block
    // definition which are not declared here.
    // only scan the body, not any unconnected other scripts
    var names = [],
        inputNames;
    if (this.body) {
        inputNames = this.inputNames();
        this.body.expression.forAllChildren(morph => {
            var vName,
                dec;
            if (morph instanceof BlockMorph) {
                vName = morph.getVarName();
                if (vName) {
                    dec = morph.rewind(true).find(elem =>
                        elem.selector === 'reportGetVar' &&
                        elem.isTemplate &&
                        (elem.instantiationSpec || elem.blockSpec) === vName
                    );
                    if (!dec &&
                            !this.variableNames.includes(vName) &&
                            !inputNames.includes(vName) &&
                            !names.includes(vName)
                    ) {
                        names.push(vName);
                    }
                }
            }
        });
    }
    return names.sort();
};

// CustomBlockDefinition - migrating primitive inputs to custom declared ones

CustomBlockDefinition.prototype.declarationFor = function (spec) {
    // Private - answer a new Array representing the settings of the input
    // label part specified by the given inputSpec, so former primitive
    // blocks in the block dictionary can be turned into custom blocks with
    // the same look & feel.
    // The Array slots represent the following fields:
    //
    //      0:  type
    //      1:  default
    //      2:  options
    //      3:  isReadOnly
    //      4:  isIrreplaceable
    //      5:  separator (multi)
    //      6:  collapse (multi)
    //      7:  expand (multi)
    //      8:  initial slots (multi)
    //      9:  minSlots (multi)
    //      10: maxSlots (multi)
    //

    var part = SyntaxElementMorph.prototype.labelPart(spec),
        decl = new Array(11),
        options;

    // type
    decl[0] = Process.prototype.slotSpec(
        Process.prototype.slotType(
            part instanceof RingMorph ?
                // cannot access the slot spec because we don't have a block
                // so we use this hack for rings instead
                ('crp'.indexOf(part.blockSpec[2]) + 6).toString()
                : (part instanceof MultiArgMorph &&
                        part.slotSpec instanceof Array ?
                    part.slotSpec
                    : part.getSpec())
        )
    );

    // default - must be queried from the blocks dictionary of primitives
    // decl[1]

    // options
    options = part instanceof InputSlotMorph ?
        (isString(part.choices) ?
            '§_' + part.choices
            : this.decodeChoices(part.choices))
        : '';
    if (!(options instanceof List)) {
        options = new List([options]);
    }
    decl[2] = this.encodeChoices(options);

    // isReadOnly
    decl[3] = part instanceof InputSlotMorph ? part.isReadOnly : true;

    // isIrreplaceable
    decl[4] = part.isStatic;

    // separator
    decl[5] = part instanceof MultiArgMorph ? part.infix : '' ;

    // collapse
    decl[6] = part instanceof MultiArgMorph ? part.collapse : '';

    // expands
    decl[7] = part instanceof MultiArgMorph ?
        (part.labelText instanceof Array ?
            part.labelText.map(item => item.replaceAll('\n', ' ')).join('\n')
            : (part.labelText || '').replaceAll('\n', ' '))
        : '';

    // initial slots
    decl[8] = part instanceof MultiArgMorph ? part.initialSlots : '';

    // min slots
    decl[9] = part instanceof MultiArgMorph ? part.minInputs : '';

    // max slots
    decl[10] = part instanceof MultiArgMorph ? part.maxInputs : '';

    return decl;
};

// CustomBlockDefinition bootstrapping - overload primitives

CustomBlockDefinition.prototype.bootstrap = function (actor) {
    var rcvr = actor || this.receiver,
        stage, ide, idx;
    if (this.isGlobal && this.selector) {
        SpriteMorph.prototype.blocks[this.selector].definition = this;
        if (rcvr) {
            stage = rcvr.parentThatIsA(StageMorph);
            idx = stage.globalBlocks.indexOf(this);
            if (idx !== -1) {
                stage.globalBlocks.splice(idx, 1);
            }
            ide = rcvr.parentThatIsA(IDE_Morph);
            if (ide) {
                ide.flushBlocksCache();
                ide.categories.refreshEmpty();
                ide.refreshPalette(true);
            }
            rcvr.recordUserEdit(
                'palette',
                'custom block',
                'bootstrap',
                this.selector
            );
        }
    }
};

CustomBlockDefinition.prototype.unBootstrap = function (actor) {
    var rcvr = actor || this.receiver,
        stage, ide;
    if (this.isBootstrapped()) {
        delete SpriteMorph.prototype.blocks[this.selector].definition;
        if (rcvr) {
            stage = rcvr.parentThatIsA(StageMorph);
            stage.globalBlocks.push(this);
            ide = rcvr.parentThatIsA(IDE_Morph);
            if (ide) {
                // ide.flushPaletteCache();
                ide.flushBlocksCache();
                ide.categories.refreshEmpty();
                ide.refreshPalette(true);
            }
            rcvr.recordUserEdit(
                'palette',
                'custom block',
                'un-bootstrap',
                this.selector
            );
        }
    }
};

CustomBlockDefinition.prototype.isBootstrapped = function () {
    return this.isGlobal && this.selector &&
        SpriteMorph.prototype.blocks[this.selector]?.definition === this;
};

CustomBlockDefinition.prototype.isQuasiPrimitive = function () {
    return this.isBootstrapped() &&
        (this.primitive === this.selector ||
            this.selector === 'reportHyperZip') &&
        this.codeMapping !== null;
};

// CustomCommandBlockMorph /////////////////////////////////////////////

// CustomCommandBlockMorph inherits from CommandBlockMorph:

CustomCommandBlockMorph.prototype = new CommandBlockMorph();
CustomCommandBlockMorph.prototype.constructor = CustomCommandBlockMorph;
CustomCommandBlockMorph.uber = CommandBlockMorph.prototype;

// CustomCommandBlockMorph shared settings:

CustomCommandBlockMorph.prototype.isCustomBlock = true;

// CustomCommandBlockMorph instance creation:

function CustomCommandBlockMorph(definition, isProto) {
    this.init(definition, isProto);
}

CustomCommandBlockMorph.prototype.init = function (definition, isProto) {
    this.definition = definition; // mandatory
    this.semanticSpec = '';
    this.isGlobal = definition ? definition.isGlobal : false;
    this.isPrototype = isProto || false; // optional
    CustomCommandBlockMorph.uber.init.call(this);
    if (isProto) {
        this.isTemplate = true;
    }
    this.category = definition.category;
    this.selector = definition.primitive || 'evaluateCustomBlock';
    this.variables = null;
	this.storedTranslations = null; // transient - only for "wishes"
    this.initializeVariables(definition.variableNames);
    if (definition) { // needed for de-serializing
        this.refresh();
    }
};

CustomCommandBlockMorph.prototype.reactToTemplateCopy = function () {
    var def;
    if (this.isPrototype) {
        def = this.definition;
        this.isPrototype = false;
        this.setSpec(' ');
        this.refresh();
        this.refreshDefaults(def);
    }
    CustomCommandBlockMorph.uber.reactToTemplateCopy.call(this);
};

CustomCommandBlockMorph.prototype.initializeVariables = function (names, old) {
    this.variables = new VariableFrame();
    names.forEach(name => {
        var v = old ? old[name] : null;
        this.variables.addVar(
            name,
            v instanceof Variable ? v.value : null
        );
    });
};

CustomCommandBlockMorph.prototype.refresh = function (aDefinition, offset) {
    var def = aDefinition || this.definition,
        newSpec = this.isPrototype ?
                def.spec : def.localizedSpec(),
        oldInputs;

	this.semanticSpec = def.blockSpec();

    // make sure local custom blocks don't hold on to a method.
    // future performance optimization plan:
    // null out the definition for local blocks here,
    // and then cache them again when invoking them
    if (!this.isGlobal && !this.isPrototype) {
        this.definition = null;
    }

    this.setCategory(def.category);
    this.selector = def.primitive || 'evaluateCustomBlock';
    if (this.blockSpec !== newSpec) {
        oldInputs = this.inputs();
        if (!this.zebraContrast) {
            this.forceNormalColoring();
        } else {
            this.fixBlockColor();
        }
        this.setSpec(newSpec, def);
        this.fixLabelColor();
    } else { // update all input slots' drop-downs
        this.inputs().forEach((inp, i) => {
            if (inp instanceof ArgMorph &&
                    !(inp instanceof TemplateSlotMorph)) {
                inp.isStatic = def.isIrreplaceableInputIdx(i);
                inp.canBeEmpty = !inp.isStatic;
            }
            if (inp instanceof InputSlotMorph) {
                inp.setChoices.apply(inp, def.inputOptionsOfIdx(i));
            }
        });
    }

    // find unnamed upvars (indicated by non-breaking space) and label them
    // to their internal definition (default).
    // make sure to set the separator, collapse and expand labels
    // for variadic input slots
    this.cachedInputs = null;
    this.inputs().forEach((inp, idx) => {
        if (inp instanceof TemplateSlotMorph && inp.contents() === '\xa0') {
            inp.setContents(def.inputNames()[idx]);
        } else if (inp instanceof MultiArgMorph) {
            inp.setIrreplaceable(def.isIrreplaceableInputIdx(idx));
            if (!['%scriptVars', '%receive', '%send', '%elseif'].includes(
                inp.elementSpec
            )) {
                inp.setInfix(def.separatorOfInputIdx(idx));
                inp.setCollapse(def.collapseOfInputIdx(idx));
                inp.setExpand(def.expandOfInputIdx(idx));
                inp.setDefaultValue(def.defaultValueOfInputIdx(idx));
                inp.setInitialSlots(def.initialSlotsOfInputIdx(idx));
                inp.setMinSlots(def.minSlotsOfInputIdx(idx));
                inp.setMaxSlots(def.maxSlotsOfInputIdx(idx));
            }
        }
    });

    // restore old inputs if any
    if (oldInputs) {
        this.restoreInputs(oldInputs, offset);
    }

    // initialize block vars
    // preserve values of unchanged variable names
    this.initializeVariables(def.variableNames, this.variables.vars);

    // make (double) sure I'm colored correctly
    this.forceNormalColoring();
    this.fixBlockColor(null, true);
};

CustomCommandBlockMorph.prototype.restoreInputs = function (oldInputs, offset) {
    // try to restore my previous inputs when my spec has been changed

    if (offset) { // || this.definition?.primitive) {
        // assuming a "relabel" action that needs to shift inputs
        this.refreshDefaults();
        BlockMorph.prototype.restoreInputs.call(this, oldInputs, offset);
        return;
    }

    var newInputs = this.inputs(),
        len = Math.max(oldInputs.length, newInputs.length),
        scripts = this.parentThatIsA(ScriptsMorph),
        old,
        inp,
        i;

    function preserve(item) {
        // keep unused blocks around in the scripting area
        if (item instanceof MultiArgMorph) {
            return item.inputs().forEach(slot => preserve(slot));
        } else if (item instanceof CSlotMorph ) {
            item = item.evaluate();
        }
        if (item instanceof BlockMorph && scripts) {
            scripts.add(item);
            item.moveBy(new Point(20, 20));
            item.fixBlockColor();
        }
    }

    if (this.isPrototype) {return; }
    this.cachedInputs = null;
    for (i = 0; i < len; i += 1) {
        inp = newInputs[i];
        old = oldInputs[i];
        if (old instanceof ArgLabelMorph) {
            old = old.argMorph();
        }
        if (old instanceof ReporterBlockMorph && inp &&
                (!(inp instanceof TemplateSlotMorph))) {
            this.replaceInput(inp, old.fullCopy());
        } else if (old instanceof InputSlotMorph &&
                inp instanceof InputSlotMorph) {
            if (old.isEmptySlot()) {
                inp.setContents('');
            } else {
                inp.setContents(old.evaluate());
            }
        } else if (old instanceof BooleanSlotMorph &&
                inp instanceof BooleanSlotMorph) {
            inp.setContents(old.evaluate());
        } else if (old instanceof TemplateSlotMorph &&
                inp instanceof TemplateSlotMorph) {
            inp.setContents(old.evaluate());
        } else if (old instanceof CSlotMorph &&
                inp instanceof CSlotMorph) {
            inp.nestedBlock(old.evaluate());
        } else if (old instanceof MultiArgMorph &&
                inp instanceof MultiArgMorph &&
                (old.slotSpec === inp.slotSpec)) {
            this.replaceInput(inp, old.fullCopy());
        } else {
            preserve(old);
        }
    }
    this.cachedInputs = null;
};

CustomCommandBlockMorph.prototype.refreshDefaults = function (definition) {
    // fill my editable slots with the defaults specified in my definition
    if (this.isPrototype) {
        return;
    }

    var inputs = this.inputs(),
        idx = 0;

    inputs.forEach(inp => {
        var i;
        if (inp instanceof InputSlotMorph ||
            inp instanceof BooleanSlotMorph ||
            inp instanceof TemplateSlotMorph ||
            inp instanceof ColorSlotMorph
        ) {
            inp.setContents(
                (definition || this.definition).defaultValueOfInputIdx(idx)
            );
        } else if (inp instanceof MultiArgMorph) {
            // collapse and expand to the initial number of slots
            inp.collapseAll();
            for (i = 0; i < inp.initialSlots; i += 1) {
                inp.addInput();
            }
            // populate each subslot with its default preset value, if any
            inp.inputs().forEach((slot, i) => {
                if (slot instanceof InputSlotMorph) {
                    slot.setContents(inp.defaultValueFor(i));
                }
            });
        }
        idx += 1;
    });
    this.cachedInputs = null;
};

CustomCommandBlockMorph.prototype.refreshPrototype = function () {
    // create my label parts from my (edited) fragments only
    var hat,
        protoSpec,
        frags = [],
        myself = this, // CAUTION: myself changes its value in this method
        words,
        newFrag,
        i = 0;

    if (!this.isPrototype) {return null; }

    hat = this.parentThatIsA(PrototypeHatBlockMorph);

    // remember the edited fragments
    this.parts().forEach(part => {
        if (!part.fragment.isDeleted) {
            // take into consideration that a fragment may spawn others
            // if it isn't an input label consisting of several words
            if (part.fragment.type) { // marked as input, take label as is
                frags.push(part.fragment);
            } else { // not an input, devide into several non-input fragments
                words = myself.definition.parseSpec(
                    part.fragment.labelString
                );
                words.forEach(word => {
                    newFrag = part.fragment.copy();
                    newFrag.labelString = word;
                    frags.push(newFrag);
                });
            }
        }
    });

    // remember the edited prototype spec,
    // and prevent removing the last one
    protoSpec = this.specFromFragments() || this.blockSpec;

    // update the prototype's type
    // and possibly exchange 'this' for 'myself'
    if (this instanceof CustomCommandBlockMorph && hat.type !== 'command') {
        if (['reporter', 'predicate'].includes(hat.type)) {
            myself = new CustomReporterBlockMorph(
                this.definition,
                hat.type === 'predicate',
                true
            );
        } else if (hat.type === 'hat') {
            myself = new CustomHatBlockMorph(
                this.definition,
                true
            );
        }
        hat.replaceInput(this, myself);
    } else if (this instanceof CustomReporterBlockMorph) {
        if (hat.type === 'command') {
            myself = new CustomCommandBlockMorph(
                this.definition,
                true
            );
            hat.replaceInput(this, myself);
        } else if (hat.type === 'hat') {
            myself = new CustomHatBlockMorph(
                this.definition,
                true
            );
            hat.replaceInput(this, myself);
        } else if (this.isPredicate !== (hat.type === 'predicate')) {
            this.isPredicate = (hat.type === 'predicate');
            this.fixLayout();
            this.rerender();
        }
    } else if (this instanceof CustomHatBlockMorph && hat.type !== 'hat') {
        if (hat.type === 'command') {
            myself = new CustomCommandBlockMorph(
                this.definition,
                true
            );
        } else if (['reporter', 'predicate'].includes(hat.type)) {
            myself = new CustomReporterBlockMorph(
                this.definition,
                hat.type === 'predicate',
                true
            );
        }
        hat.replaceInput(this, myself);
    }

    // update the (new) prototype's category & color
    myself.setCategory(hat.blockCategory || 'other');
    hat.fixBlockColor();

    // update the (new) prototype's appearance
    myself.setSpec(protoSpec);

    // update the (new) prototype's (new) fragments
    // with the previously edited ones

    myself.parts().forEach(part => {
        if (!(part instanceof BlockLabelPlaceHolderMorph)) {
            if (frags[i]) { // don't delete the default fragment
                part.fragment = frags[i];
            }
            i += 1;
        }
    });

    // refresh slot type indicators
    this.refreshPrototypeSlotTypes();

    hat.fixLayout();
};

CustomCommandBlockMorph.prototype.refreshPrototypeSlotTypes = function () {
    this.parts().forEach(part => {
        if (part instanceof BlockInputFragmentMorph) {
            part.template().instantiationSpec = part.contents();
            part.setContents(part.fragment.defTemplateSpecFragment());
        }
    });
    this.fixBlockColor(null, true); // enforce zebra coloring of templates
};


CustomCommandBlockMorph.prototype.inputFragmentNames = function () {
    // for the variable name slot drop-down menu (in the block editor)
    var ans = [];

    this.parts().forEach(part => {
        if (!part.fragment.isDeleted && (part.fragment.type)) {
            ans.push(part.fragment.labelString);
        }
    });
    return ans;
};

CustomCommandBlockMorph.prototype.upvarFragmentNames = function () {
    // for the variable name slot drop-down menu (in the block editor)
    var ans = [];

    this.parts().forEach(part => {
        if (!part.fragment.isDeleted && (part.fragment.type === '%upvar')) {
            ans.push(part.fragment.labelString);
        }
    });
    return ans;
};

CustomCommandBlockMorph.prototype.upvarFragmentName = function (idx) {
    // for block prototypes while they are being edited
    return this.upvarFragmentNames()[idx] || '\u2191';
};

CustomCommandBlockMorph.prototype.specFromFragments = function () {
    // for block prototypes while they are being edited
    var ans = '';

    this.parts().forEach(part => {
        if (!part.fragment.isDeleted) {
            ans = ans + part.fragment.defSpecFragment() + ' ';
        }
    });
    return ans.trim();
};

CustomCommandBlockMorph.prototype.blockSpecFromFragments = function () {
    // for block instances while their prototype is being edited
    var ans = '';

    this.parts().forEach(part => {
        if (!part.fragment.isDeleted) {
            ans = ans + part.fragment.blockSpecFragment() + ' ';
        }
    });
    return ans.trim();
};

CustomCommandBlockMorph.prototype.declarationsFromFragments = function () {
    // returns a Map object for type declarations:
    //     key: inputName
    //     value: [type, default, options, isReadOnly]
    var ans = new Map();

    this.parts().forEach(part => {
        if (part instanceof BlockInputFragmentMorph) {
            ans.set(
                part.fragment.labelString,
                [
                    part.fragment.type,
                    part.fragment.defaultValue,
                    part.fragment.options,
                    part.fragment.isReadOnly,
                    part.fragment.isIrreplaceable,
                    part.fragment.separator,
                    part.fragment.collapse,
                    part.fragment.expand,
                    part.fragment.initialSlots,
                    part.fragment.minSlots,
                    part.fragment.maxSlots
                ]
            );
        }
    });
    return ans;
};

CustomCommandBlockMorph.prototype.parseSpec = function (spec) {
    if (!this.isPrototype) {
        return CustomCommandBlockMorph.uber.parseSpec.call(this, spec);
    }
    return CustomBlockDefinition.prototype.parseSpec(spec);
};

CustomCommandBlockMorph.prototype.mouseClickLeft = function () {
    if (!this.isPrototype) {
        return CustomCommandBlockMorph.uber.mouseClickLeft.call(this);
    }
    this.edit();
};

CustomCommandBlockMorph.prototype.edit = function () {
    var def = this.definition,
        editor, block,
        hat,
        rcvr;

    if (this.isPrototype) {
        block = this.definition.blockInstance();
        block.addShadow();
        hat = this.parentThatIsA(PrototypeHatBlockMorph);
        new BlockDialogMorph(
            null,
            (definition) => {
                if (definition) { // temporarily update everything
                    hat.blockCategory = definition.category;
                    hat.type = definition.type;
                    this.refreshPrototype();
                }
            },
            this
        ).openForChange(
            'Change block',
            hat.blockCategory,
            hat.type,
            this.world(),
            block.doWithAlpha(1, () => block.fullImage()),
            this.isInUse()
        );
    } else {
        // check for local custom block inheritance
        rcvr = this.scriptTarget();
        if (!this.isGlobal) {
            if (contains(
                    Object.keys(rcvr.inheritedBlocks()),
                    this.blockSpec
                )
            ) {
                this.duplicateBlockDefinition();
                return;
            }
            def = rcvr.getMethod(this.semanticSpec);
        }
        editor = new BlockEditorMorph(def, rcvr);
        editor.popUp();
        editor.changed();
    }
};

CustomCommandBlockMorph.prototype.labelPart = function (spec) {
    if (!this.isPrototype) {
        return CustomCommandBlockMorph.uber.labelPart.call(this, spec);
    }
    if ((spec[0] === '%') && (spec.length > 1)) {
        // return new BlockInputFragmentMorph(spec.slice(1));
        return new BlockInputFragmentMorph(spec.replace(/%/g, ''));
    }
    return new BlockLabelFragmentMorph(
        spec,
        CustomCommandBlockMorph.uber.labelPart.call(this, spec)
    );
};

CustomCommandBlockMorph.prototype.placeHolder = function () {
    var part;

    part = new BlockLabelPlaceHolderMorph();
    part.fontSize = this.fontSize * 1.4;
    part.color = new Color(45, 45, 45);
    part.fixLayout();
    return part;
};

CustomCommandBlockMorph.prototype.attachTargets = function () {
    if (this.isPrototype) {
        return [];
    }
    return CustomCommandBlockMorph.uber.attachTargets.call(this);
};

CustomCommandBlockMorph.prototype.isInUse = function () {
    // answer true if an instance of my definition is found
    // in any of my receiver's scripts or block definitions
    // NOTE: for sprite-local blocks only to be used in a situation
    // where the user actively clicks on a block in the IDE,
    // e.g. to edit it (and change its type)
    var def = this.definition,
        rcvr = this.scriptTarget(),
        ide = rcvr.parentThatIsA(IDE_Morph);
    if (def.isGlobal && ide) {
        return ide.sprites.asArray().concat([ide.stage]).some((any, idx) =>
            any.usesBlockInstance(def, false, idx)
        );
    }
    return rcvr.allDependentInvocationsOf(this.blockSpec).length > 0;
};

// CustomCommandBlockMorph menu:

CustomCommandBlockMorph.prototype.userMenu = function () {
    var hat = this.parentThatIsA(PrototypeHatBlockMorph),
        rcvr = this.scriptTarget(),
        myself = this,
        shiftClicked = this.world().currentKey === 16,
        dlg, menu, def;

    function addOption(label, toggle, test, onHint, offHint) {
        menu.addItem(
            [
                test ? new SymbolMorph(
                    'checkedBox',
                    MorphicPreferences.menuFontSize * 0.75
                ) : new SymbolMorph(
                    'rectangle',
                    MorphicPreferences.menuFontSize * 0.75
                ),
                localize(label)
            ],
            toggle,
            test ? onHint : offHint
        );
    }

   function monitor(vName) {
        var stage = rcvr.parentThatIsA(StageMorph),
            varFrame = myself.variables;
        menu.addItem(
            vName + '...',
            function () {
                var watcher = detect(
                    stage.children,
                    function (morph) {
                        return morph instanceof WatcherMorph
                            && morph.target === varFrame
                            && morph.getter === vName;
                    }
                ),
                    others;
                if (watcher !== null) {
                    watcher.show();
                    watcher.fixLayout(); // re-hide hidden parts
                    return;
                }
                watcher = new WatcherMorph(
                    vName + ' ' + localize('(temporary)'),
                    SpriteMorph.prototype.blockColor.variables,
                    varFrame,
                    vName
                );
                watcher.setPosition(stage.position().add(10));
                others = stage.watchers(watcher.left());
                if (others.length > 0) {
                    watcher.setTop(others[others.length - 1].bottom());
                }
                stage.add(watcher);
                watcher.fixLayout();
            }
        );
    }

    if (this.isPrototype) {
        menu = new MenuMorph(this);
        menu.addItem(
            "script pic...",
            function () {
                var ide = this.world().children[0],
                    top = this.topBlock(),
                    xml = ide.blocksLibraryXML(
                        [top.definition].concat(
                            top.definition.collectDependencies(
                                SpriteMorph.prototype.bootstrappedBlocks(),
                                [],
                                top.scriptTarget()
                            )
                        ),
                        null,
                        true
                    );
                ide.saveFileAs(
                    embedMetadataPNG(top.scriptPic(), xml),
                    'image/png',
                    (ide.getProjectName() || localize('untitled')) + ' ' +
                        localize('script pic')
                );
            },
            'save a picture\nof this script'
        );
        menu.addItem(
            "translations...",
            function () {
                hat.parentThatIsA(BlockEditorMorph).editTranslations();
            }
        );
        if (hat.inputs().length < 2) {
            menu.addItem(
                "block variables...",
                function () {
                    hat.enableBlockVars();
                }
            );
        } else {
            menu.addItem(
                "remove block variables...",
                function () {
                    hat.enableBlockVars(false);
                }
            );
        }
        if (this.isGlobal) {
            menu.addItem(
                "selector...",
                () => hat.editSelector(),
                "overload a primitive"
            );
        }
        if (this instanceof CustomHatBlockMorph) {
            addOption(
                'condition',
                () => {
                    this.semantics = this.semantics ? null : 'rule';
                    this.changed();
                },
                this.semantics === 'rule',
                'uncheck for\nevent semantics',
                'check for\ncondition semantics'
            );
        }
        addOption(
            'in palette',
            () => hat.isHelper = !hat.isHelper,
            !hat.isHelper,
            'uncheck to\nhide in palette',
            'check to\nshow in palette'
        );
        menu.addItem(
            "export...",
            () => hat.exportBlockDefinition(),
            'including dependencies'
        );
    } else {
        menu = this.constructor.uber.userMenu.call(this);
        if (rcvr.parentThatIsA(IDE_Morph).config.noOwnBlocks) {
            return menu;
        }
        dlg = this.parentThatIsA(DialogBoxMorph);
        if (dlg && !(dlg instanceof BlockEditorMorph)) {
            return menu;
        }
        if (!menu) {
            menu = new MenuMorph(this);
        } else {
            menu.addLine();
        }
        if (this.isTemplate) { // inside the palette
            if (this.isGlobal) {
                if (shiftClicked) {
                    if (this.definition.isBootstrapped()) {
                        menu.addItem(
                            "un-bootstrap",
                            () => this.definition.unBootstrap(rcvr)
                        );
                    } else if (this.definition.selector) {
                        menu.addItem(
                            "bootstrap",
                            () => this.definition.bootstrap(rcvr),
                            'replace this corresponding primitive',
                            new Color(100, 0, 0)
                        );
                    }
                }
                menu.addItem(
                    "delete block definition...",
                    'deleteBlockDefinition'
                );
            } else { // local method
                if (contains(
                        Object.keys(rcvr.inheritedBlocks()),
                        this.blockSpec
                )) {
                    // inherited
                    addOption(
                        'inherited',
                        function () {
                            var ide = myself.parentThatIsA(IDE_Morph);
                            rcvr.customBlocks.push(
                                rcvr.getMethod(
                                    myself.blockSpec
                                ).copyAndBindTo(rcvr)
                            );
                            if (ide) {
                                ide.flushPaletteCache();
                                ide.refreshPalette();
                            }
                        },
                        true,
                        'uncheck to\ndisinherit',
                        null
                    );
                } else if (rcvr.exemplar &&
                    rcvr.exemplar.getMethod(this.blockSpec
                )) {
                    // shadowed
                    addOption(
                        'inherited',
                        'deleteBlockDefinition',
                        false,
                        null,
                        localize('check to inherit\nfrom')
                            + ' ' + rcvr.exemplar.name
                    );
                } else {
                    // own block
                    menu.addItem(
                        "delete block definition...",
                        'deleteBlockDefinition'
                    );
                }
            }
            menu.addItem(
                "duplicate block definition...",
                'duplicateBlockDefinition'
            );
            menu.addItem(
                "export block definition...",
                'exportBlockDefinition',
                'including dependencies'
            );
            if (!this.isGlobal || !this.definition.isBootstrapped()) {
                menu.addLine();
                def = this.isGlobal ? this.definition
                        : rcvr.getMethod(this.blockSpec);
                addOption(
                    'space above',
                    function () {
                        var ide = myself.parentThatIsA(IDE_Morph);
                        def.spaceAbove = !def.spaceAbove;
                        rcvr.recordUserEdit(
                            'palette',
                            'custom block',
                            def.isGlobal ? 'global' : 'local',
                            'space',
                            def.spaceAbove ? 'added' : 'removed',
                            def.abstractBlockSpec()
                        );
                        if (ide) {
                            ide.flushPaletteCache();
                            ide.refreshPalette();
                        }
                    },
                    def.spaceAbove,
                    'uncheck to remove space above',
                    'check to add space above'
                );
                menu.addPair(
                    [
                        new SymbolMorph(
                            'arrowUp',
                            MorphicPreferences.menuFontSize
                        ),
                        localize('move up')
                    ],
                    () => this.moveInPalette('up'),
                    null, // shortcut
                    'move one up in the palette'
                );
                menu.addPair(
                    [
                        new SymbolMorph(
                            'arrowDown',
                            MorphicPreferences.menuFontSize
                        ),
                        localize('move down')
                    ],
                    () => this.moveInPalette('down'),
                    null, // shortcut
                    'move one down in the palette'
                );
                menu.addLine();
            }
        } else { // inside a script
            // if global or own method - let the user delete the definition
            if (this.isGlobal && contains(
                    Object.keys(rcvr.ownBlocks()),
                    this.blockSpec
                )
            ) {
                menu.addItem(
                    "delete block definition...",
                    'deleteBlockDefinition'
                );
            }
        }

        this.variables.names().forEach(vName =>
            monitor(vName)
        );
    }
    menu.addItem("edit...", 'edit'); // works also for prototypes
    return menu;
};

CustomCommandBlockMorph.prototype.moveInPalette = function (dir = 'up') {
    var method, idx, blocks, cat, t_idx,
        rcvr = this.scriptTarget(),
        ide = rcvr.parentThatIsA(IDE_Morph),
        swap = (arr, i1, i2) => {
            let tmp = arr[i1];
            arr[i1] = arr[i2];
            arr[i2] = tmp;
        };
    if (this.isGlobal) {
        method = this.definition;
        blocks = rcvr.parentThatIsA(StageMorph).globalBlocks;
    } else {
        method = rcvr.getLocalMethod(this.blockSpec);
        blocks = rcvr.customBlocks;
	}
    idx = blocks.indexOf(method);
    if (idx > -1) {
        cat = blocks[idx].category;
        if (dir === 'up') {
            for (t_idx = idx - 1; t_idx > -1; t_idx -= 1) {
                if (blocks[t_idx].category === cat) {
                    break;
                }
            }
        } else { // 'down'
            for (t_idx = idx + 1; t_idx < blocks.length; t_idx += 1) {
                if (blocks[t_idx].category === cat) {
                    break;
                }
            }
        }
        if (-1 < t_idx && t_idx < blocks.length) {
            swap(blocks, t_idx, idx);
        }
    }
    if (ide) {
        ide.flushPaletteCache();
        ide.categories.refreshEmpty();
        ide.refreshPalette();
    }    
};

CustomCommandBlockMorph.prototype.exportBlockDefinition = function () {
    var rcvr = this.scriptTarget(),
        ide = rcvr.parentThatIsA(IDE_Morph),
        def = this.isGlobal || this instanceof PrototypeHatBlockMorph ?
            this.definition
                : rcvr.getMethod(this.blockSpec);
    new BlockExportDialogMorph(
        ide.serializer,
        [def].concat(def.collectDependencies(
            SpriteMorph.prototype.bootstrappedBlocks(),
            [],
            rcvr
        )),
        ide
    ).popUp(this.world());
};

CustomCommandBlockMorph.prototype.duplicateBlockDefinition = function () {
    var rcvr = this.scriptTarget(),
        ide = this.parentThatIsA(IDE_Morph),
        def = this.isGlobal ? this.definition : rcvr.getMethod(this.blockSpec),
        dup = def.copyAndBindTo(rcvr),
        spec = dup.spec,
        exp = dup.body? dup.body.expression : null,
        count = 1;

    function rebindRecursiveCalls(topBlock) {
        topBlock.forAllChildren(morph => {
            if (morph.definition === def) {
                morph.definition = dup;
                morph.refresh();
            }
        });
    }

    if (this.isGlobal) {
        ide.stage.globalBlocks.push(dup);
    } else {
        rcvr.customBlocks.push(dup);
    }

    // find a unique spec
    while (rcvr.doubleDefinitionsFor(dup).length > 0) {
        count += 1;
        dup.spec = spec + ' (' + count + ')';
    }

    // rebind recursive calls
    dup.scripts.forEach(script => rebindRecursiveCalls(script));
    if (exp instanceof BlockMorph) {
        rebindRecursiveCalls(exp);
    }
 

    ide.flushPaletteCache();
    ide.refreshPalette();
    rcvr.recordUserEdit(
        'palette',
        'custom block',
        this.isGlobal ? 'global' : 'local',
        'duplicate definition',
        dup.abstractBlockSpec()
    );
    new BlockEditorMorph(dup, rcvr).popUp();
};

CustomCommandBlockMorph.prototype.deleteBlockDefinition = function () {
    var idx, stage, ide, method, block,
        rcvr = this.scriptTarget();
    if (this.isPrototype) {
        return null; // under construction...
    }
    method = this.isGlobal? this.definition
            : rcvr.getLocalMethod(this.blockSpec);
    if (method.isBootstrapped()) {
        rcvr.restorePrimitive(method);
        return;
    }
    block = method.blockInstance();
    new DialogBoxMorph(
        this,
        () => {
            rcvr.deleteAllBlockInstances(method);
            if (method.isGlobal) {
                stage = rcvr.parentThatIsA(StageMorph);
                idx = stage.globalBlocks.indexOf(method);
                if (idx !== -1) {
                    stage.globalBlocks.splice(idx, 1);
                }
            } else {
                // delete local definition
                idx = rcvr.customBlocks.indexOf(method);
                if (idx !== -1) {
                    rcvr.customBlocks.splice(idx, 1);
                }
                // refresh instances of inherited method, if any
                method = rcvr.getMethod(this.blockSpec);
                if (method) {
                    rcvr.allDependentInvocationsOf(this.blockSpec).forEach(
                        block => block.refresh(method)
                    );
                }
            }
            ide = rcvr.parentThatIsA(IDE_Morph);
            if (ide) {
                ide.flushPaletteCache();
                ide.categories.refreshEmpty();
                ide.refreshPalette();
            }
            rcvr.recordUserEdit(
                'palette',
                'custom block',
                this.isGlobal ? 'global' : 'local',
                'delete definition',
                this.abstractBlockSpec()
            );
        },
        this
    ).askYesNo(
        'Delete Custom Block',
        localize('block deletion dialog text'), // long string lookup
        this.world(),
        block.doWithAlpha(
            1,
            () => {
                block.addShadow();
                return block.fullImage();
            }
        )
    );
};

// CustomCommandBlockMorph relabelling

CustomCommandBlockMorph.prototype.relabel = function (alternatives) {
    var menu = new MenuMorph(this),
        oldSpec = this.abstractBlockSpec(),
        oldInputs = this.inputs().map(each => each.fullCopy());
    alternatives.forEach(alt => {
        var def, block, sel, off;
        if (alt instanceof CustomBlockDefinition) {
            def = alt;
            block = def.blockInstance();
            block.restoreInputs(oldInputs);
        } else { // assume a selector or tuple: selector, offset
            if (alt instanceof Array) {
                sel = alt[0];
                off = -alt[1];
            } else {
                sel = alt;
                off = 0;
            }
            block = SpriteMorph.prototype.blockForSelector(sel, true);
            if (!block.isCustomBlock || !block.isGlobal) {
                return;
            }
            def = block.definition;
            block.restoreInputs(oldInputs, off);
        }
        block.fixBlockColor(null, true);
        block.addShadow(new Point(3, 3));
        menu.addItem(
            block.doWithAlpha(1, () => block.fullImage()),
            () => {
                this.definition = def;
                this.isGlobal = def.isGlobal;
                this.refresh(def, off);
                this.fixLayout();
                this.scriptTarget().recordUserEdit(
                    'scripts',
                    'block',
                    'relabel',
                    oldSpec,
                    this.abstractBlockSpec()
                );
            }
        );
    });
    menu.popup(this.world(), this.bottomLeft().subtract(new Point(
        8,
        this instanceof CommandBlockMorph ? this.corner : 0
    )));
};

CustomCommandBlockMorph.prototype.alternatives = function () {
    var rcvr = this.scriptTarget(),
        stage = rcvr.parentThatIsA(StageMorph),
        allDefs = rcvr.customBlocks.concat(stage.globalBlocks),
        type = this instanceof CommandBlockMorph ? 'command'
            : (this.isPredicate ? 'predicate' : 'reporter');

    if (this.isGlobal && this.definition.primitive) {
        return (SpriteMorph.prototype.blockAlternatives[
            this.definition.primitive] || []).filter(sel =>
                StageMorph.prototype.hiddenPrimitives[sel] !== true);
    }
    return allDefs.filter(each =>
        each !== this.definition && each.type === type && !each.isHelper
    );
};

// CustomCommandBlockMorph events /////////////////////////////////////

CustomCommandBlockMorph.prototype.fireSlotEditedEvent= function (slot) {
    var rcvr = this.scriptTarget(),
        def = this.isGlobal ? this.definition
            : rcvr.getMethod(this.blockSpec),
        names = def.inputNames(),
        inputName = names[this.inputs().indexOf(slot)],
        scripts = def.scripts.filter(each =>
            each.selector === 'receiveSlotEvent' &&
                each.inputs()[0].evaluate() === inputName &&
                each.inputs()[1].evaluateOption() === 'edited'),
        stage = rcvr.parentThatIsA(StageMorph),
        vars;

    // fully evaluate the block's inputs, including embedded reporters, if any
    vars = new InputList(this, names);

    // evaluate the scripts concurrently
    scripts.forEach(script =>
        stage.threads.startProcess(
            script,
            rcvr,
            null, // threadsafe
            null, // export result
            null, // callback
            null, // clicked
            null, // right away
            null, // atomic
            vars
        )
    );
};

// CustomCommandBlockMorph accessing slots by their name //////////////

CustomCommandBlockMorph.prototype.inputSlotNamed = function (name) {
    var rcvr = this.scriptTarget(),
        def = this.isGlobal ? this.definition : rcvr.getMethod(this.blockSpec);
    return this.inputs()[def.inputNames().map(each =>
        each.toLowerCase()).indexOf(name.toLowerCase())];
};

// CustomReporterBlockMorph ////////////////////////////////////////////

// CustomReporterBlockMorph inherits from ReporterBlockMorph:

CustomReporterBlockMorph.prototype = new ReporterBlockMorph();
CustomReporterBlockMorph.prototype.constructor = CustomReporterBlockMorph;
CustomReporterBlockMorph.uber = ReporterBlockMorph.prototype;

// CustomReporterBlockMorph shared settings:

CustomReporterBlockMorph.prototype.isCustomBlock = true;

// CustomReporterBlockMorph instance creation:

function CustomReporterBlockMorph(definition, isPredicate, isProto) {
    this.init(definition, isPredicate, isProto);
}

CustomReporterBlockMorph.prototype.init = function (
    definition,
    isPredicate,
    isProto
) {
    this.definition = definition; // mandatory
    this.semanticSpec = ''; // used for translations
    this.isGlobal = definition ? definition.isGlobal : false;
    this.isPrototype = isProto || false; // optional
    CustomReporterBlockMorph.uber.init.call(this, isPredicate, true); // sil.
    if (isProto) {
        this.isTemplate = true;
    }
    this.category = definition.category;
    this.storedTranslations = null; // transient - only for "wishes"
    this.variables = new VariableFrame();
    this.initializeVariables(definition.variableNames);
    this.selector = definition.primitive || 'evaluateCustomBlock';
    if (definition) { // needed for de-serializing
        this.refresh();
    }
};

CustomReporterBlockMorph.prototype.initializeVariables =
    CustomCommandBlockMorph.prototype.initializeVariables;

CustomReporterBlockMorph.prototype.reactToTemplateCopy =
    CustomCommandBlockMorph.prototype.reactToTemplateCopy;

CustomReporterBlockMorph.prototype.refresh = function (aDefinition, offset) {
    var def = aDefinition || this.definition;
    CustomCommandBlockMorph.prototype.refresh.call(this, aDefinition, offset);
    if (!this.isPrototype) {
        this.isPredicate = (def.type === 'predicate');
    }
    if (this.parent instanceof SyntaxElementMorph) {
        this.parent.cachedInputs = null;
    }
    this.fixLayout();
};

CustomReporterBlockMorph.prototype.mouseClickLeft = function () {
    if (!this.isPrototype) {
        return CustomReporterBlockMorph.uber.mouseClickLeft.call(this);
    }
    this.edit();
};

CustomReporterBlockMorph.prototype.placeHolder
    = CustomCommandBlockMorph.prototype.placeHolder;

CustomReporterBlockMorph.prototype.parseSpec
    = CustomCommandBlockMorph.prototype.parseSpec;

CustomReporterBlockMorph.prototype.edit
    = CustomCommandBlockMorph.prototype.edit;

CustomReporterBlockMorph.prototype.labelPart
    = CustomCommandBlockMorph.prototype.labelPart;

CustomReporterBlockMorph.prototype.upvarFragmentNames
    = CustomCommandBlockMorph.prototype.upvarFragmentNames;

CustomReporterBlockMorph.prototype.upvarFragmentName
    = CustomCommandBlockMorph.prototype.upvarFragmentName;

CustomReporterBlockMorph.prototype.inputFragmentNames
    = CustomCommandBlockMorph.prototype.inputFragmentNames;

CustomReporterBlockMorph.prototype.specFromFragments
    = CustomCommandBlockMorph.prototype.specFromFragments;

CustomReporterBlockMorph.prototype.blockSpecFromFragments
    = CustomCommandBlockMorph.prototype.blockSpecFromFragments;

CustomReporterBlockMorph.prototype.declarationsFromFragments
    = CustomCommandBlockMorph.prototype.declarationsFromFragments;

CustomReporterBlockMorph.prototype.refreshPrototype
    = CustomCommandBlockMorph.prototype.refreshPrototype;

CustomReporterBlockMorph.prototype.refreshPrototypeSlotTypes
    = CustomCommandBlockMorph.prototype.refreshPrototypeSlotTypes;

CustomReporterBlockMorph.prototype.restoreInputs
    = CustomCommandBlockMorph.prototype.restoreInputs;

CustomReporterBlockMorph.prototype.refreshDefaults
    = CustomCommandBlockMorph.prototype.refreshDefaults;

CustomReporterBlockMorph.prototype.isInUse
    = CustomCommandBlockMorph.prototype.isInUse;

// CustomReporterBlockMorph menu:

CustomReporterBlockMorph.prototype.userMenu
    = CustomCommandBlockMorph.prototype.userMenu;

CustomReporterBlockMorph.prototype.moveInPalette =
    CustomCommandBlockMorph.prototype.moveInPalette;

CustomReporterBlockMorph.prototype.duplicateBlockDefinition
    = CustomCommandBlockMorph.prototype.duplicateBlockDefinition;

CustomReporterBlockMorph.prototype.deleteBlockDefinition
    = CustomCommandBlockMorph.prototype.deleteBlockDefinition;

CustomReporterBlockMorph.prototype.exportBlockDefinition
    = CustomCommandBlockMorph.prototype.exportBlockDefinition;

// CustomReporterBlockMorph events:

CustomReporterBlockMorph.prototype.fireSlotEditedEvent =
    CustomCommandBlockMorph.prototype.fireSlotEditedEvent;

// CustomReporterBlockMorph accessing slots by their name

CustomReporterBlockMorph.prototype.inputSlotNamed =
    CustomCommandBlockMorph.prototype.inputSlotNamed;

// hover help - commented out for now
/*
CustomReporterBlockMorph.prototype.mouseEnter
    = CustomCommandBlockMorph.prototype.mouseEnter;

CustomReporterBlockMorph.prototype.mouseLeave
    = CustomCommandBlockMorph.prototype.mouseLeave;
*/

// CustomReporterBlockMorph bubble help:

CustomReporterBlockMorph.prototype.bubbleHelp
    = CustomCommandBlockMorph.prototype.bubbleHelp;

CustomReporterBlockMorph.prototype.popUpbubbleHelp
    = CustomCommandBlockMorph.prototype.popUpbubbleHelp;

// CustomReporterBlockMorph relabelling

CustomReporterBlockMorph.prototype.relabel
    = CustomCommandBlockMorph.prototype.relabel;

CustomReporterBlockMorph.prototype.alternatives
    = CustomCommandBlockMorph.prototype.alternatives;

// CustomHatBlockMorph ////////////////////////////////////////////

// CustomHatBlockMorph inherits from HatBlockMorph:

CustomHatBlockMorph.prototype = new HatBlockMorph();
CustomHatBlockMorph.prototype.constructor = CustomHatBlockMorph;
CustomHatBlockMorph.uber = HatBlockMorph.prototype;

// CustomHatBlockMorph shared settings:

CustomHatBlockMorph.prototype.isCustomBlock = true;

// CustomHatBlockMorph instance creation:

function CustomHatBlockMorph(definition, isProto) {
    this.init(definition, isProto);
}

CustomHatBlockMorph.prototype.init = function (definition, isProto) {
    this.definition = definition; // mandatory
    this.semanticSpec = '';
    this.isGlobal = definition ? definition.isGlobal : false;
    this.isPrototype = isProto || false; // optional

    // additional property for custom hat blocks
    this.semantics = null; // "event" (default) or "rule"

    CustomCommandBlockMorph.uber.init.call(this);
    if (isProto) {
        this.isTemplate = true;
    }
    this.category = definition.category;
    this.selector = definition.primitive || 'evaluateCustomBlock';
    this.variables = null;
	this.storedTranslations = null; // transient - only for "wishes"
    this.initializeVariables(definition.variableNames);
    if (definition) { // needed for de-serializing
        this.refresh();
    }
};

CustomHatBlockMorph.prototype.initializeVariables =
    CustomCommandBlockMorph.prototype.initializeVariables;

CustomHatBlockMorph.prototype.reactToTemplateCopy =
    CustomCommandBlockMorph.prototype.reactToTemplateCopy;

CustomHatBlockMorph.prototype.refresh = function (aDefinition, offset) {
    var def = aDefinition || this.definition;
    this.semantics = def.semantics || null;
    CustomCommandBlockMorph.prototype.refresh.call(this, aDefinition, offset);
    this.changed();
};

CustomHatBlockMorph.prototype.isRuleHat = function () {
    return !!this.semantics; // currently either "rule" or null for "event"
};

CustomHatBlockMorph.prototype.mouseClickLeft = function () {
    if (!this.isPrototype) {
        return CustomHatBlockMorph.uber.mouseClickLeft.call(this);
    }
    this.edit();
};

CustomHatBlockMorph.prototype.placeHolder =
    CustomCommandBlockMorph.prototype.placeHolder;

CustomHatBlockMorph.prototype.parseSpec =
    CustomCommandBlockMorph.prototype.parseSpec;

CustomHatBlockMorph.prototype.edit =
    CustomCommandBlockMorph.prototype.edit;

CustomHatBlockMorph.prototype.labelPart =
    CustomCommandBlockMorph.prototype.labelPart;

CustomHatBlockMorph.prototype.upvarFragmentNames =
    CustomCommandBlockMorph.prototype.upvarFragmentNames;

CustomHatBlockMorph.prototype.upvarFragmentName
    = CustomCommandBlockMorph.prototype.upvarFragmentName;

CustomHatBlockMorph.prototype.inputFragmentNames
    = CustomCommandBlockMorph.prototype.inputFragmentNames;

CustomHatBlockMorph.prototype.specFromFragments
    = CustomCommandBlockMorph.prototype.specFromFragments;

CustomHatBlockMorph.prototype.blockSpecFromFragments
    = CustomCommandBlockMorph.prototype.blockSpecFromFragments;

CustomHatBlockMorph.prototype.declarationsFromFragments
    = CustomCommandBlockMorph.prototype.declarationsFromFragments;

CustomHatBlockMorph.prototype.refreshPrototype
    = CustomCommandBlockMorph.prototype.refreshPrototype;

CustomHatBlockMorph.prototype.refreshPrototypeSlotTypes
    = CustomCommandBlockMorph.prototype.refreshPrototypeSlotTypes;

CustomHatBlockMorph.prototype.restoreInputs
    = CustomCommandBlockMorph.prototype.restoreInputs;

CustomHatBlockMorph.prototype.refreshDefaults
    = CustomCommandBlockMorph.prototype.refreshDefaults;

CustomHatBlockMorph.prototype.isInUse
    = CustomCommandBlockMorph.prototype.isInUse;

CustomHatBlockMorph.prototype.attachTargets
    = CustomCommandBlockMorph.prototype.attachTargets;

// CustomHatBlockMorph menu:

CustomHatBlockMorph.prototype.userMenu
    = CustomCommandBlockMorph.prototype.userMenu;

CustomHatBlockMorph.prototype.moveInPalette =
    CustomCommandBlockMorph.prototype.moveInPalette;

CustomHatBlockMorph.prototype.duplicateBlockDefinition
    = CustomCommandBlockMorph.prototype.duplicateBlockDefinition;

CustomHatBlockMorph.prototype.deleteBlockDefinition
    = CustomCommandBlockMorph.prototype.deleteBlockDefinition;

CustomHatBlockMorph.prototype.exportBlockDefinition
    = CustomCommandBlockMorph.prototype.exportBlockDefinition;

// CustomHatBlockMorph events:

CustomHatBlockMorph.prototype.fireSlotEditedEvent =
    CustomCommandBlockMorph.prototype.fireSlotEditedEvent;

// CustomHatBlockMorph accessing slots by their name

CustomHatBlockMorph.prototype.inputSlotNamed =
    CustomCommandBlockMorph.prototype.inputSlotNamed;

// hover help - commented out for now
/*
CustomHatBlockMorph.prototype.mouseEnter
    = CustomCommandBlockMorph.prototype.mouseEnter;

CustomHatBlockMorph.prototype.mouseLeave
    = CustomCommandBlockMorph.prototype.mouseLeave;
*/

// CustomHatBlockMorph bubble help:

CustomHatBlockMorph.prototype.bubbleHelp
    = CustomCommandBlockMorph.prototype.bubbleHelp;

CustomHatBlockMorph.prototype.popUpbubbleHelp
    = CustomCommandBlockMorph.prototype.popUpbubbleHelp;

// CustomHatBlockMorph relabelling

CustomHatBlockMorph.prototype.relabel
    = CustomCommandBlockMorph.prototype.relabel;

CustomHatBlockMorph.prototype.alternatives
    = CustomCommandBlockMorph.prototype.alternatives;

// CustomHatBlockMorph syntax analysis

CustomHatBlockMorph.prototype.reify = BlockMorph.prototype.reify;

// JaggedBlockMorph ////////////////////////////////////////////////////

/*
    I am a reporter block with jagged left and right edges conveying the
    appearance of having the broken out of a bigger block. I am used to
    display input types in the long form input dialog.
*/

// JaggedBlockMorph inherits from ReporterBlockMorph:

JaggedBlockMorph.prototype = new ReporterBlockMorph();
JaggedBlockMorph.prototype.constructor = JaggedBlockMorph;
JaggedBlockMorph.uber = ReporterBlockMorph.prototype;

// JaggedBlockMorph instance creation:

function JaggedBlockMorph(spec) {
    this.init(spec);
}

JaggedBlockMorph.prototype.init = function (spec) {
    JaggedBlockMorph.uber.init.call(this);
    if (spec) {this.setSpec(spec); }
    if (spec === '%cs' || (spec === '%ca')) {
        this.minWidth = 25;
        this.fixLayout();
    }
};

// JaggedBlockMorph drawing:

JaggedBlockMorph.prototype.outlinePath = function (ctx, inset) {
    var w = this.width(),
        h,
        jags,
        delta,
        pos = this.position(),
        y = 0,
        i;

    ctx.moveTo(inset, inset);
    ctx.lineTo(w - inset, inset);

    // C-Slots
    this.cSlots().forEach(slot => {
        slot.outlinePath(ctx, inset, slot.position().subtract(pos));
        y += slot.height();
    });

    h = this.height() - y - inset;
    jags = Math.round(h / this.jag);
    delta = h / jags;

    // y = 0;
    for (i = 0; i < jags; i += 1) {
        y += delta / 2;
        ctx.lineTo(w - this.jag / 2 - inset, y);
        y += delta / 2;
        ctx.lineTo(w - inset, y);
    }

    h = this.height() - inset;
    jags = Math.round(h / this.jag);
    delta = h / jags;

    ctx.lineTo(inset, h - inset);
    y = h;
    for (i = 0; i < jags; i += 1) {
        y -= delta / 2;
        ctx.lineTo(this.jag / 2 + inset, y);
        y -= delta / 2;
        ctx.lineTo(inset, y);
    }
};

JaggedBlockMorph.prototype.drawEdges = function (ctx) {
    var w = this.width(),
        h = this.height(),
        jags = Math.round(h / this.jag),
        delta = h / jags,
        shift = this.edge / 2,
        gradient,
        i,
        y;

    ctx.lineWidth = this.edge;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        this.edge
    );
    gradient.addColorStop(0, this.cachedClrBright);
    gradient.addColorStop(1, this.cachedClr);
    ctx.strokeStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(shift, shift);
    ctx.lineTo(w - shift, shift);
    ctx.stroke();

    if (!this.cSlots().length) { // omit right jagged outline for c-slots
        y = 0;
        for (i = 0; i < jags; i += 1) {
            ctx.strokeStyle = this.cachedClrDark;
            ctx.beginPath();
            ctx.moveTo(w - shift, y);
            y += delta / 2;
            ctx.lineTo(w - this.jag / 2 - shift, y);
            ctx.stroke();
            y += delta / 2;
        }
    }

    gradient = ctx.createLinearGradient(
        0,
        h - this.edge,
        0,
        h
    );
    gradient.addColorStop(0, this.cachedClr);
    gradient.addColorStop(1, this.cachedClrDark);
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(w - shift, h - shift);
    ctx.lineTo(shift, h - shift);
    ctx.stroke();

    y = h;
    for (i = 0; i < jags; i += 1) {
        ctx.strokeStyle = this.cachedClrBright;
        ctx.beginPath();
        ctx.moveTo(shift, y);
        y -= delta / 2;
        ctx.lineTo(this.jag / 2 + shift, y);
        ctx.stroke();
        y -= delta / 2;
    }
};

// BlockDialogMorph ////////////////////////////////////////////////////

// BlockDialogMorph inherits from DialogBoxMorph:

BlockDialogMorph.prototype = new DialogBoxMorph();
BlockDialogMorph.prototype.constructor = BlockDialogMorph;
BlockDialogMorph.uber = DialogBoxMorph.prototype;

// BlockDialogMorph instance creation:

function BlockDialogMorph(target, action, environment) {
    this.init(target, action, environment);
}

BlockDialogMorph.prototype.init = function (target, action, environment) {
    // additional properties:
    this.blockType = 'command';
    this.category = 'other';
    this.isGlobal = true;
    this.types = null;
    this.categories = null;

    // initialize inherited properties:
    BlockDialogMorph.uber.init.call(
        this,
        target,
        action,
        environment
    );

    // override inherited properites:
    this.key = 'makeABlock';

    this.types = new AlignmentMorph('row', this.padding);
    this.add(this.types);
    this.scopes = new AlignmentMorph('row', this.padding);
    this.add(this.scopes);

    this.categories = new BoxMorph();
    this.categories.color = SpriteMorph.prototype.paletteColor.lighter(8);
    this.categories.borderColor = this.categories.color.lighter(40);
    this.categories.buttons = [];

    this.categories.refresh = function () {
        this.buttons.forEach(cat => {
            cat.refresh();
            if (cat.state) {
                cat.scrollIntoView();
            }
        });
    };

    this.createCategoryButtons();
    this.fixCategoriesLayout();
    this.add(this.categories);

    this.createTypeButtons();
    this.createScopeButtons();
    this.fixLayout();
};

BlockDialogMorph.prototype.openForChange = function (
    title,
    category,
    type,
    world,
    pic,
    preventTypeChange // <bool>
) {
    var clr = SpriteMorph.prototype.blockColorFor(category);
    this.key = 'changeABlock';
    this.category = category;
    this.blockType = type;

    this.categories.refresh();
    this.types.children.forEach(each => {
        each.setColor(clr);
        each.refresh();
    });

    this.labelString = title;
    this.createLabel();
    if (pic) {this.setPicture(pic); }
    this.addButton('ok', 'OK');
    this.addButton('cancel', 'Cancel');
    if (preventTypeChange) {
        this.types.destroy();
        this.types = null;
    }
    this.scopes.destroy();
    this.scopes = null;
    this.fixLayout();
    this.rerender();
    this.popUp(world);
};

// category buttons

BlockDialogMorph.prototype.createCategoryButtons = function () {
    SpriteMorph.prototype.categories.forEach(cat =>
        this.addCategoryButton(cat)
    );

    // sort alphabetically
    Array.from(
        SpriteMorph.prototype.customCategories.keys()
    ).sort().forEach(name =>
        this.addCustomCategoryButton(
            name,
            SpriteMorph.prototype.customCategories.get(name)
        )
    );
};

BlockDialogMorph.prototype.addCategoryButton = function (category) {
    var labelWidth = 75,
        colors = [
            IDE_Morph.prototype.frameColor,
            IDE_Morph.prototype.frameColor.darker
                (IDE_Morph.prototype.isBright ? 5 : 50
            ),
            SpriteMorph.prototype.blockColorFor(category)
        ],
        button;

    button = new ToggleButtonMorph(
        colors,
        this, // this block dialog box is the target
        () => {
            this.category = category;
            this.categories.refresh();
            if (this.types) {
                this.types.children.forEach(each =>
                    each.setColor(colors[2])
                );
            }
            this.edit();
        },
        category[0].toUpperCase().concat(category.slice(1)), // UCase label
        () => this.category === category, // query
        null, // env
        null, // hint
        labelWidth, // minWidth
        true // has preview
    );

    button.corner = 8;
    button.padding = 0;
    button.labelShadowOffset = new Point(-1, -1);
    button.labelShadowColor = colors[1];
    button.labelColor = IDE_Morph.prototype.buttonLabelColor;
        if (MorphicPreferences.isFlat) {
            button.labelPressColor = WHITE;
        }
    button.contrast = this.buttonContrast;
    button.fixLayout();
    button.refresh();
    this.categories.add(button);
    this.categories.buttons.push(button);
    return button;
};

BlockDialogMorph.prototype.addCustomCategoryButton = function (category, clr) {
    var labelWidth = 172,
        colors = [
            IDE_Morph.prototype.frameColor,
            IDE_Morph.prototype.frameColor.darker
                (IDE_Morph.prototype.isBright ? 5 : 50
            ),
            clr
        ],
        button;

    button = new ToggleButtonMorph(
        colors,
        this, // this block dialog box is the target
        () => {
            this.category = category;
            this.categories.refresh();
            if (this.types) {
                this.types.children.forEach(each =>
                    each.setColor(colors[2])
                );
            }
            this.edit();
        },
        category, // UCase label
        () => this.category === category, // query
        null, // env
        null, // hint
        labelWidth, // minWidth
        true // has preview
    );

    button.corner = 8;
    button.padding = 0;
    button.labelShadowOffset = new Point(-1, -1);
    button.labelShadowColor = colors[1];
    button.labelColor = IDE_Morph.prototype.buttonLabelColor;
        if (MorphicPreferences.isFlat) {
            button.labelPressColor = WHITE;
        }
    button.contrast = this.buttonContrast;
    button.fixLayout();
    button.refresh();
    this.categories.add(button);
    this.categories.buttons.push(button);
    return button;
};

BlockDialogMorph.prototype.fixCategoriesLayout = function () {
    var buttonWidth = this.categories.children[0].width(), // all the same
        buttonHeight = this.categories.children[0].height(), // all the same
        more = SpriteMorph.prototype.customCategories.size,
        xPadding = 15,
        yPadding = 2,
        border = 10, // this.categories.border,
        l = this.categories.left(),
        t = this.categories.top(),
        scroller,
        row,
        col,
        i;

    this.categories.setWidth(
        3 * xPadding + 2 * buttonWidth
    );

    this.categories.children.forEach((button, i) => {
        if (i < 8) {
            row = i % 4;
            col = Math.ceil((i + 1) / 4);
        } else if (i < 10) {
            row = 4;
            col = 3 - (10 - i);
        } else {
            row = i - 5;
            col = 1;
        }
        button.setPosition(new Point(
            l + (col * xPadding + ((col - 1) * buttonWidth)),
            t + ((row + 1) * yPadding + (row * buttonHeight) + border) +
                (i > 9 ? border / 2 : 0)
        ));
    });

    if (MorphicPreferences.isFlat) {
        this.categories.corner = 0;
        this.categories.border = 0;
        this.categories.edge = 0;
    }

    if (more > 6) {
        scroller = new ScrollFrameMorph(
            null,
            null,
            SpriteMorph.prototype.sliderColor.lighter()
        );
        scroller.setColor(this.categories.color);
        scroller.acceptsDrops = false;
        scroller.contents.acceptsDrops = false;
        scroller.setPosition(
            new Point(
                this.categories.left() + this.categories.border,
                this.categories.children[10].top()
            )
        );
        scroller.setWidth(this.categories.width() - this.categories.border * 2);
        scroller.setHeight(buttonHeight * 6 + yPadding * 5);

        for (i = 0; i < more; i += 1) {
            scroller.addContents(this.categories.children[10]);
        }
        this.categories.add(scroller);
        this.categories.setHeight(
            (5 + 1) * yPadding
                + 5 * buttonHeight
                + 6 * (yPadding + buttonHeight) + border + 2
                + 2 * border
        );
    } else {
        this.categories.setHeight(
            (5 + 1) * yPadding
                + 5 * buttonHeight
                + (more ? (more * (yPadding + buttonHeight) + border / 2) : 0)
                + 2 * border
        );
    }
};

// type radio buttons

BlockDialogMorph.prototype.createTypeButtons = function () {
    var block,
        clr = SpriteMorph.prototype.blockColorFor(this.category);


    block = new CommandBlockMorph();
    block.setColor(clr);
    block.setSpec(localize('Command'));
    this.addBlockTypeButton(
        () => this.setType('command'),
        block,
        () => this.blockType === 'command'
    );

    block = new ReporterBlockMorph();
    block.setColor(clr);
    block.setSpec(localize('Reporter'));
    this.addBlockTypeButton(
        () => this.setType('reporter'),
        block,
        () => this.blockType === 'reporter'
    );

    block = new ReporterBlockMorph(true);
    block.setColor(clr);
    block.setSpec(localize('Predicate'));
    this.addBlockTypeButton(
        () => this.setType('predicate'),
        block,
        () => this.blockType === 'predicate'
    );

    block = new HatBlockMorph();
    block.setColor(clr);
    block.setSpec(localize('Event Hat'));
    this.addBlockTypeButton(
        () => this.setType('hat'),
        block,
        () => this.blockType === 'hat'
    );
};

BlockDialogMorph.prototype.addBlockTypeButton = function (
    action,
    element,
    query
) {
    var button = new ToggleElementMorph(
        this,
        action,
        element,
        query,
        null,
        null,
        'rebuild'
    );
    button.refresh();
    button.fixLayout();
    this.types.add(button);
    return button;
};

BlockDialogMorph.prototype.addTypeButton = function (action, label, query) {
    var button = new ToggleMorph(
        'radiobutton',
        this,
        action,
        label,
        query
    );
    button.edge = this.buttonEdge / 2;
    button.outline = this.buttonOutline / 2;
    button.outlineColor = this.buttonOutlineColor;
    button.outlineGradient = this.buttonOutlineGradient;
    button.contrast = this.buttonContrast;

    button.fixLayout();
    this.types.add(button);
    return button;
};

BlockDialogMorph.prototype.setType = function (blockType) {
    this.blockType = blockType || this.blockType;
    this.types.children.forEach(c => c.refresh());
    this.edit();
};

// scope radio buttons

BlockDialogMorph.prototype.createScopeButtons = function () {
    this.addScopeButton(
        () => this.setScope('global'),
        "for all sprites",
        () => this.isGlobal
    );
    this.addScopeButton(
        () => this.setScope('local'),
        "for this sprite only",
        () => !this.isGlobal
    );
};

BlockDialogMorph.prototype.addScopeButton = function (action, label, query) {
    var button = new ToggleMorph(
        'radiobutton',
        this,
        action,
        label,
        query
    );
    button.edge = this.buttonEdge / 2;
    button.outline = this.buttonOutline / 2;
    button.outlineColor = this.buttonOutlineColor;
    button.outlineGradient = this.buttonOutlineGradient;
    button.contrast = this.buttonContrast;

    button.fixLayout();
    this.scopes.add(button);
    return button;
};


BlockDialogMorph.prototype.setScope = function (varType) {
    this.isGlobal = (varType === 'global');
    this.scopes.children.forEach(c => c.refresh());
    this.edit();
};

// other ops

BlockDialogMorph.prototype.getInput = function () {
    var spec, def, body;
    if (this.body instanceof InputFieldMorph) {
        spec = this.normalizeSpaces(this.body.getValue());
    }
    def = new CustomBlockDefinition(spec);
    def.type = this.blockType;
    def.category = this.category;
    def.isGlobal = this.isGlobal;
    if (def.type !== 'command') {
        body = Process.prototype.reify.call(
            null,
            SpriteMorph.prototype.blockForSelector('doReport'),
            new List(),
            true // ignore empty slots for custom block reification
        );
        body.outerContext = null;
        def.body = body;
    }
    return def;
};

BlockDialogMorph.prototype.fixLayout = function () {
    var th = fontHeight(this.titleFontSize) + this.titlePadding * 2;

    if (this.body) {
        this.body.setPosition(this.position().add(new Point(
            this.padding,
            th + this.padding
        )));
        this.bounds.setWidth(this.body.width() + this.padding * 2);
        this.bounds.setHeight(
            this.body.height()
                + this.padding * 2
                + th
        );
        if (this.categories) {
            this.categories.setCenter(this.body.center());
            this.categories.setTop(this.body.top());
            this.body.setTop(this.categories.bottom() + this.padding);
            this.bounds.setHeight(
                this.height()
                    + this.categories.height()
                    + this.padding
            );
        }
    } else if (this.head) { // when changing an existing prototype
        if (this.types) {
            this.types.fixLayout();
            this.bounds.setWidth(
                Math.max(this.types.width(), this.head.width())
                    + this.padding * 2
            );
        } else {
            this.bounds.setWidth(
                Math.max(this.categories.width(), this.head.width())
                    + this.padding * 2
            );
        }
        this.head.setCenter(this.center());
        this.head.setTop(th + this.padding);
        this.bounds.setHeight(
            this.head.height()
                + this.padding * 2
                + th
        );
        if (this.categories) {
            this.categories.setCenter(this.center());
            this.categories.setTop(this.head.bottom() + this.padding);
            this.bounds.setHeight(
                this.height()
                    + this.categories.height()
                    + this.padding
            );
        }
    }

    if (this.types) {
        this.types.fixLayout();
        this.bounds.setHeight(
            this.height()
                    + this.types.height()
                    + this.padding
        );
        this.bounds.setWidth(Math.max(
            this.width(),
            this.types.width() + this.padding * 2
        ));
        this.types.setCenter(this.center());
        if (this.body) {
            this.types.setTop(this.body.bottom() + this.padding);
            this.body.setWidth(Math.max(
                this.types.width() - this.padding,
                this.body.width()
            ));
        } else if (this.categories) {
            this.types.setTop(this.categories.bottom() + this.padding);
        }
    }

    if (this.label) {
        this.label.setCenter(this.center());
        this.label.setTop(this.top() + (th - this.label.height()) / 2);
    }

    if (this.body && this.categories) {
        this.categories.setLeft(
            this.body.left() + (this.body.width() - this.categories.width()) / 2
        );
    }

    if (this.scopes) {
        this.scopes.fixLayout();
        this.bounds.setHeight(
            this.height()
                    + this.scopes.height()
                    + (this.padding / 3)
        );
        this.bounds.setWidth(Math.max(
            this.width(),
            this.scopes.width() + this.padding * 2
        ));
        this.scopes.setCenter(this.center());
        if (this.types) {
            this.scopes.setTop(this.types.bottom() + (this.padding / 3));
        }
    }

    if (this.buttons && (this.buttons.children.length > 0)) {
        this.buttons.fixLayout();
        this.bounds.setHeight(
            this.height()
                    + this.buttons.height()
                    + this.padding
        );
        this.buttons.setCenter(this.center());
        this.buttons.setBottom(this.bottom() - this.padding);
    }

    // refresh a shallow shadow
    this.removeShadow();
    this.addShadow();
};

BlockDialogMorph.prototype.accept = function () {
    if ((this.body instanceof InputFieldMorph) &&
            (this.normalizeSpaces(this.body.getValue()) === '')) {
        this.edit();
    } else {
        BlockDialogMorph.uber.accept.call(this);
    }
};

// BlockEditorMorph ////////////////////////////////////////////////////

// BlockEditorMorph inherits from DialogBoxMorph:

BlockEditorMorph.prototype = new DialogBoxMorph();
BlockEditorMorph.prototype.constructor = BlockEditorMorph;
BlockEditorMorph.uber = DialogBoxMorph.prototype;

// BlockEditorMorph instance creation:

function BlockEditorMorph(definition, target) {
    this.init(definition, target);
}

BlockEditorMorph.prototype.init = function (definition, target) {
    var scripts, proto, scriptsFrame, block, comment, prim,
        isLive = Process.prototype.enableLiveCoding ||
            Process.prototype.enableSingleStepping;

    // additional properties:
    this.definition = definition;
    this.translations = definition.translationsAsText();
    this.handle = null;
    this.primitive = null; // optional selector when editing a primitive block

    // initialize inherited properties:
    BlockEditorMorph.uber.init.call(
        this,
        target,
        () => this.updateDefinition(),
        target
    );

    // override inherited properites:
    this.key = 'editBlock' + definition.spec;
    this.labelString = this.definition.isGlobal ? 'Block Editor'
    		: 'Method Editor';
    this.createLabel();

    // create scripting area
    scripts = new ScriptsMorph();
    scripts.rejectsHats = true;
    scripts.isDraggable = false;
    scripts.color = IDE_Morph.prototype.groupColor;
    scripts.cachedTexture = MorphicPreferences.isFlat ? null
        : IDE_Morph.prototype.scriptsTexture();
    scripts.cleanUpMargin = 10;

    proto = new PrototypeHatBlockMorph(this.definition);
    proto.setPosition(scripts.position().add(10));
    if (definition.comment !== null) {
        comment = definition.comment.fullCopy();
        proto.comment = comment;
        comment.block = proto;
    }

    if (definition.primitive && !definition.body) {
        prim = SpriteMorph.prototype.blockForSelector('doPrimitive');
        prim.inputs()[0].setContents(true);
        prim.inputs()[1].setContents(definition.primitive);
        proto.nextBlock(prim);
    } else if (definition?.body?.expression) {
        proto.nextBlock(isLive ? definition.body.expression
                : definition.body.expression.fullCopy()
        );
    }
    scripts.add(proto);

    this.definition.scripts.forEach(element => {
        block = isLive ? element : element.fullCopy();
        block.setPosition(scripts.position().add(element.position()));
        scripts.add(block);
        if (block instanceof BlockMorph) {
            block.allComments().forEach(comment =>
                comment.align(block)
            );
        }
    });
    proto.allComments().forEach(comment =>
        comment.align(proto)
    );

    scriptsFrame = new ScrollFrameMorph(scripts);
    scriptsFrame.padding = 10;
    scriptsFrame.growth = 50;
    scriptsFrame.isDraggable = false;
    scriptsFrame.acceptsDrops = false;
    scriptsFrame.contents.acceptsDrops = true;
    scripts.scrollFrame = scriptsFrame;
    scripts.updateToolbar();

    this.addBody(scriptsFrame);
    this.addButton('ok', 'OK');
    if (!isLive) {
        this.addButton('updateDefinition', 'Apply');
        this.addButton('cancel', 'Cancel');
    }

    this.setExtent(new Point(375, 300)); // normal initial extent
    this.fixLayout();
    scripts.fixMultiArgs();

    block = proto.parts()[0];
    block.forceNormalColoring();
    proto.fixBlockColor(null, true);

};

BlockEditorMorph.prototype.popUp = function () {
    var world = this.target.world();

    if (world) {
        BlockEditorMorph.uber.popUp.call(this, world);
        this.setInitialDimensions();
        this.handle = new HandleMorph(
            this,
            280,
            220,
            this.corner,
            this.corner
        );
        world.keyboardFocus = null;
    }
};

BlockEditorMorph.prototype.justDropped = function () {
    // override the inherited default behavior, which is to
    // give keyboard focus to dialog boxes, as in this case
    // we want Snap-global keyboard-shortcuts like ctrl-f
    // to still work
    nop();
};

// BlockEditorMorph ops

BlockEditorMorph.prototype.accept = function (origin) {
    // check DialogBoxMorph comment for accept()
    if (origin instanceof CursorMorph) {return; }
    if (this.action) {
        if (this.primitive) {
            this.target.customizePrimitive(
                this.primitive,
                false,
                this.definition
            );
        }
        if (typeof this.target === 'function') {
            if (typeof this.action === 'function') {
                this.target.call(this.environment, this.action.call());
            } else {
                this.target.call(this.environment, this.action);
            }
        } else {
            if (typeof this.action === 'function') {
                this.action.call(this.target, this.getInput());
            } else { // assume it's a String
                this.target[this.action](this.getInput());
            }
        }
    }
    this.close();
};

BlockEditorMorph.prototype.cancel = function (origin) {
    if (origin instanceof CursorMorph) {return; }
    //this.refreshAllBlockInstances();
    this.close();
};

BlockEditorMorph.prototype.close = function () {
    var doubles, block;

    // assert that no scope conflicts exists, i.e. that a global
    // definition doesn't contain any local custom blocks, as they
    // will be rendered "Obsolete!" when reloading the project
    if (this.definition.isGlobal) {
        block = detect(
            this.body.contents.allChildren(),
            morph => morph.isCustomBlock && !morph.isGlobal
        );
        if (block) {
            block = block.scriptTarget()
                .getMethod(block.semanticSpec)
                .blockInstance();
            block.addShadow();
            new DialogBoxMorph().inform(
                'Local Block(s) in Global Definition',
                'This global block definition contains one or more\n'
                    + 'local custom blocks which must be removed first.',
                this.world(),
                block.doWithAlpha(1, () => block.fullImage())
            );
            return;
        }
    }

    // allow me to disappear only when name collisions
    // have been resolved
    doubles = this.target.doubleDefinitionsFor(this.definition);
    if (doubles.length > 0) {
        block = doubles[0].blockInstance();
        block.addShadow();
        new DialogBoxMorph(this, 'consolidateDoubles', this).askYesNo(
            'Same Named Blocks',
            'Another custom block with this name exists.\n'
                + 'Would you like to replace it?',
            this.world(),
            block.doWithAlpha(1, () => block.fullImage())
        );
        return;
    }

    this.destroy();
};

BlockEditorMorph.prototype.consolidateDoubles = function () {
    this.target.replaceDoubleDefinitionsFor(this.definition);
    this.destroy();
};

BlockEditorMorph.prototype.refreshAllBlockInstances = function (oldSpec) {
    var def = this.definition,
        template = this.target.paletteBlockInstance(def);

    function isMajorTypeChange(oldType) {
        var rep = ['reporter', 'predicate'],
            type = def.type;
        return (type === 'command' && rep.includes(oldType)) ||
            (oldType == 'command' && rep.includes(type));
    }

    if (def.isGlobal) {
        this.target.allBlockInstances(def).reverse().forEach(
            block => block.refresh()
        );
        this.target.parentThatIsA(StageMorph).allContextsUsing(def).forEach(
            context => {
                if (context.expression.isCustomBlock &&
                    context.expression.isUnattached() &&
                    isMajorTypeChange(context.expression.type())
                ) {
                    context.expression = def.blockInstance();
                }
                context.changed();
            }
        );
    } else {
        this.target.allDependentInvocationsOf(oldSpec).reverse().forEach(
            block => block.refresh(def)
        );
        this.target.parentThatIsA(StageMorph).allContextsInvoking(
            def.blockSpec(),
            this.target
        ).forEach(
            context => {
                if (context.expression.isCustomBlock &&
                    context.expression.isUnattached() &&
                    isMajorTypeChange(context.expression.type())
                ) {
                    context.expression = def.blockInstance();
                }
                context.changed();
            }
        );
    }
    if (template) {
        template.refreshDefaults();
    }
};

BlockEditorMorph.prototype.updateDefinition = function () {
    var head, ide,
        oldSpec = this.definition.blockSpec(),
        pos = this.body.contents.position(),
        count = 1,
        menuHats = [],
        spec, element;

    this.definition.receiver = this.target; // only for serialization
    this.definition.spec = this.prototypeSpec();
    this.definition.declarations = this.prototypeSlots();
    this.definition.variableNames = this.variableNames();
    this.definition.semantics = this.prototypeSemantics();
    this.definition.scripts = [];
    this.definition.updateTranslations(this.translations);
    this.definition.cachedTranslation = null;
    this.definition.editorDimensions = this.bounds.copy();
    this.definition.cachedIsRecursive = null; // flush the cache, don't update

    this.body.contents.children.forEach(morph => {
        if (morph instanceof PrototypeHatBlockMorph) {
            head = morph;
        } else if (morph instanceof BlockMorph ||
                (morph instanceof CommentMorph && !morph.block)) {
            element = morph.fullCopy();
            element.parent = null;
            element.setPosition(morph.position().subtract(pos));
            this.definition.scripts.push(element);
            if (element.selector === 'receiveSlotEvent' &&
                element.inputs()[1].evaluateOption() === 'menu'
            ) {
                menuHats.push(element);
            }
        }
    });

    if (head) {
        if (this.definition.category !== head.blockCategory) {
            this.target.shadowAttribute('scripts');
        }
        this.definition.category = head.blockCategory;
        this.definition.type = head.type;
        this.definition.isHelper = head.isHelper;
        if (head.blockSelector && this.definition.isGlobal) {
            this.definition.selector = head.blockSelector;
        }
        if (head.comment) {
            this.definition.comment = head.comment.fullCopy();
            this.definition.comment.block = true; // serialize in short form
        } else {
            this.definition.comment = null;
        }
    }

    // automatically declare custom dropdown menus
    if (menuHats.length) {
        menuHats.forEach(hat => {
            let slot = hat.inputs()[0].evaluate(),
                info = this.definition.declarations.get(slot);
            if (slot !== '' && info && !info[2]) {
                info[2] = this.definition.encodeChoices(
                    new List(['§_dynamicMenu'])
                );
                this.definition.declarations.set(slot, info);
            }
        });
    }

    this.definition.body = this.context(head);
    if (this.definition.body?.expression?.selector === 'doPrimitive' &&
        this.definition.body.expression.inputs()[0].value
    ) {
        this.definition.setPrimitive(
            this.definition.body.expression.inputs()[1].contents().text || null
        );
    } else {
        this.definition.primitive = null;
    }

    // make sure the spec is unique
    spec = this.definition.spec;
    while (this.target.doubleDefinitionsFor(this.definition).length > 0) {
        count += 1;
        this.definition.spec = spec + ' (' + count + ')';
    }

    this.refreshAllBlockInstances(oldSpec);
    ide = this.target.parentThatIsA(IDE_Morph);
    ide.flushPaletteCache();
    ide.categories.refreshEmpty();
    ide.refreshPalette();
    this.target.recordUserEdit(
        'scripts',
        'custom block',
        this.definition.isGlobal ? 'global' : 'local',
        'update',
        this.definition.abstractBlockSpec()
    );
};

BlockEditorMorph.prototype.context = function (prototypeHat) {
    // answer my script reified for deferred execution
    // if no prototypeHat is given, my body is scanned
    var head, topBlock, stackFrame;

    head = prototypeHat || detect(
        this.body.contents.children,
        c => c instanceof PrototypeHatBlockMorph
    );
    topBlock = head.nextBlock();
    if (topBlock === null) {
        return null;
    }
    topBlock.allChildren().forEach(c => {
        if (c instanceof BlockMorph) {c.cachedInputs = null; }
    });
    stackFrame = Process.prototype.reify.call(
        null,
        topBlock,
        new List(this.definition.inputNames()),
        true // ignore empty slots for custom block reification
    );
    stackFrame.outerContext = null;
    stackFrame.comment = head?.comment?.text();
    return stackFrame;
};

BlockEditorMorph.prototype.prototypeSpec = function () {
    // answer the spec represented by my (edited) block prototype
    return detect(
        this.body.contents.children,
        c => c instanceof PrototypeHatBlockMorph
    ).parts()[0].specFromFragments();
};

BlockEditorMorph.prototype.prototypeSlots = function () {
    // answer the slot declarations from my (edited) block prototype
    return detect(
        this.body.contents.children,
        c => c instanceof PrototypeHatBlockMorph
    ).parts()[0].declarationsFromFragments();
};

BlockEditorMorph.prototype.prototypeSemantics = function () {
    // answer the semantics represented by my (edited) block prototype
    return detect(
        this.body.contents.children,
        c => c instanceof PrototypeHatBlockMorph
    ).parts()[0].semantics;
};

BlockEditorMorph.prototype.variableNames = function () {
    // answer the variable declarations from my prototype hat
    return detect(
        this.body.contents.children,
        c => c instanceof PrototypeHatBlockMorph
    ).variableNames();
};

BlockEditorMorph.prototype.isHelper = function () {
    // answer the helper declaration from my (edited) prototype hat
    return detect(
        this.body.contents.children,
        c => c instanceof PrototypeHatBlockMorph
    ).isHelper;
};

// BlockEditorMorph translation

BlockEditorMorph.prototype.editTranslations = function () {
    var block = this.definition.blockInstance();
    block.addShadow(new Point(3, 3));
    new DialogBoxMorph(
        this,
        text => this.translations = text,
        this
    ).promptCode(
        'Custom Block Translations',
        this.translations,
        this.world(),
        block.doWithAlpha(1, () => block.fullImage()),
        this.definition.abstractBlockSpec() +
            '\n\n' +
            localize('Enter one translation per line. ' +
                'use colon (":") as lang/spec delimiter\n' +
                'and underscore ("_") as placeholder for an input, ' +
                'e.g.:\n\nen:say _ for _ secs')
    );
};

// BlockEditorMorph layout

BlockEditorMorph.prototype.setInitialDimensions = function () {
    var world = this.world(),
        mex = world.extent().subtract(new Point(this.padding, this.padding)),
        th = fontHeight(this.titleFontSize) + this.titlePadding * 2,
        bh = this.buttons.height();

    if (this.definition.editorDimensions) {
        this.setPosition(this.definition.editorDimensions.origin);
        this.setExtent(this.definition.editorDimensions.extent().min(mex));
        this.keepWithin(world);
        return;
    }
    this.setExtent(
        this.body.contents.extent().add(
            new Point(this.padding, this.padding + th + bh)
        ).min(mex)
    );
    this.setCenter(this.world().center());
};

BlockEditorMorph.prototype.fixLayout = function () {
    var th = fontHeight(this.titleFontSize) + this.titlePadding * 2;

    if (this.buttons && (this.buttons.children.length > 0)) {
        this.buttons.fixLayout();
    }

    if (this.body) {
        this.body.setPosition(this.position().add(new Point(
            this.padding,
            th + this.padding
        )));
        this.body.setExtent(new Point(
            this.width() - this.padding * 2,
            this.height() - this.padding * 3 - th - this.buttons.height()
        ));
    }

    if (this.label) {
        this.label.setCenter(this.center());
        this.label.setTop(this.top() + (th - this.label.height()) / 2);
    }

    if (this.buttons && (this.buttons.children.length > 0)) {
        this.buttons.setCenter(this.center());
        this.buttons.setBottom(this.bottom() - this.padding);
    }

    // refresh a shallow shadow
    this.removeShadow();
    this.addShadow();
};

// PrototypeHatBlockMorph /////////////////////////////////////////////

// PrototypeHatBlockMorph inherits from HatBlockMorph:

PrototypeHatBlockMorph.prototype = new HatBlockMorph();
PrototypeHatBlockMorph.prototype.constructor = PrototypeHatBlockMorph;
PrototypeHatBlockMorph.uber = HatBlockMorph.prototype;

// PrototypeHatBlockMorph instance creation:

function PrototypeHatBlockMorph(definition) {
    this.init(definition);
}

PrototypeHatBlockMorph.prototype.init = function (definition) {
    var proto = definition.prototypeInstance(),
        vars;

    this.definition = definition;

    // additional attributes to store edited data
    this.blockCategory = definition ? definition.category : null;
    this.type = definition ? definition.type : null;
    this.isHelper = definition ? definition.isHelper : false;
    this.blockSelector = definition && definition.isGlobal ?
        definition.selector : null;

    // init inherited stuff
    HatBlockMorph.uber.init.call(this);
    this.color = SpriteMorph.prototype.blockColor.control;
    this.category = 'control';
    this.add(proto);
    if (definition.variableNames.length) {
        vars = this.labelPart('%blockVars');
        this.add(this.labelPart('%br'));
        this.add(vars);
        definition.variableNames.forEach(name =>
            vars.addInput(name)
        );
    }
    proto.refreshPrototypeSlotTypes(); // show slot type indicators
    this.fixLayout();
    proto.fixBlockColor(this, true);
};

PrototypeHatBlockMorph.prototype.mouseClickLeft = function () {
    // relay the mouse click to my prototype block to
    // pop-up a Block Dialog, unless the shift key
    // is pressed, in which case initiate keyboard
    // editing support

    if (this.world().currentKey === 16) { // shift-clicked
        return this.focus();
    }
    this.parts()[0].mouseClickLeft();
};

PrototypeHatBlockMorph.prototype.userMenu = function () {
    return this.parts()[0].userMenu();
};

PrototypeHatBlockMorph.prototype.exportBlockDefinition =
    CustomCommandBlockMorph.prototype.exportBlockDefinition;

// PrototypeHatBlockMorph zebra coloring

PrototypeHatBlockMorph.prototype.fixBlockColor = function (
    nearestBlock,
    isForced
) {
    var nearest = this.parts()[0] || nearestBlock;

    if (!this.zebraContrast && !isForced) {
        return;
    }
    if (!this.zebraContrast && isForced) {
        return this.forceNormalColoring();
    }

    if (nearest.category === this.category) {
        if (nearest.color.eq(this.color)) {
            this.alternateBlockColor();
        }
    } else if (this.category && !this.color.eq(
            SpriteMorph.prototype.blockColorFor(this.category)
        )) {
        this.alternateBlockColor();
    }
    if (isForced) {
        this.fixChildrensBlockColor(true);
    }
};

// PrototypeHatBlockMorph block instance variables

PrototypeHatBlockMorph.prototype.variableNames = function (choice) {
    var parts = this.parts();
    if (parts.length < 3) {return []; }
    return parts[2].evaluate();
};

PrototypeHatBlockMorph.prototype.enableBlockVars = function (choice) {
    var prot = this.parts()[0];
    if (choice === false) {
        this.setSpec('%s', true);
    } else {
        this.setSpec('%s %br %blockVars', true);
    }
    this.replaceInput(this.parts()[0], prot);
    this.spec = null;
};

// PrototypeHatBlockMorph overloading a primitive with a custom block

PrototypeHatBlockMorph.prototype.editSelector = function () {
    var block = this.definition.blockInstance();
    block.addShadow(new Point(3, 3));

    new DialogBoxMorph(
        this,
        str => this.blockSelector = str,
        this
    ).prompt(
        "Selector",
        this.blockSelector || '',
        this.world(),
        block.doWithAlpha(1, () => block.fullImage()),
        this.selectorMenu
    );
};

PrototypeHatBlockMorph.prototype.selectorMenu = function () {
    var lst = [];
    Object.keys(SpriteMorph.prototype.blocks).forEach(sel => {
        var block = SpriteMorph.prototype.blockForSelector(sel);
        if (!isNil(block) &&
                !(block instanceof HatBlockMorph) &&
                !(block instanceof RingMorph)) {
            block.addShadow(new Point(3, 3));
            lst.push([
                [block.doWithAlpha(1, () => block.fullImage()), sel],
                sel
            ]);
        }
    });
    return lst;
};

PrototypeHatBlockMorph.prototype.blockSequence = function () {
    // override my inherited method so that I am not part of my sequence
    var result;
    result = HatBlockMorph.uber.blockSequence.call(this);
    result.shift();
    return result;
};

// BlockLabelFragment //////////////////////////////////////////////////

// BlockLabelFragment instance creation:

function BlockLabelFragment(labelString) {
    this.labelString = labelString || '';
    this.type = '%s';    // null for label, a spec for an input
    this.defaultValue = '';
    this.options = '';
    this.isReadOnly = false; // for input slots
    this.isIrreplaceable = false;
    this.separator = null; // for variadic slots
    this.collapse = null; // for variadic slots
    this.expand = null; // for variadic slots
    this.initialSlots = 1; // for variadic slots
    this.minSlots = 0; // for variadic slots, 0 means none
    this.maxSlots = 0; // for variadic slots, 0 means none
    this.isDeleted = false;
}

// accessing

BlockLabelFragment.prototype.defSpecFragment = function () {
    // answer a string representing my prototype's spec
    var pref = this.type ? '%\'' : '';
    return this.isDeleted ?
            '' : pref + this.labelString + (this.type ? '\'' : '');
};

BlockLabelFragment.prototype.defTemplateSpecFragment = function () {
    // answer a string representing my prototype's spec
    // which also indicates my type, default value or arity
    var suff = '';
    if (!this.type) {return this.defSpecFragment(); }
    if (this.isUpvar()) {
        suff = ' \u2191' + (
            this.defaultValue ? ' = ' + this.defaultValue.toString() : ''
        );
    } else if (this.type === '%scriptVars') {
        suff = ' \u2191...';
    } else if (this.isMultipleInput() ||
        ['%receive', '%send', '%elseif'].includes(this.type)
    ) {
        suff = '...';
    } else if (['%cs', '%ca', '%loop'].includes(this.type)) {
        suff = ' \u03BB'; // ' [\u03BB'
    } else if (this.type === '%b') {
        suff = ' ?';
    } else if (this.type === '%l') {
        suff = ' \uFE19';
    } else if (this.type === '%obj') {
        suff = ' $turtleOutline';
    } else if (this.type === '%clr') {
        suff = ' $pipette';
    } else if (contains(
            ['%cmdRing', '%repRing', '%predRing', '%anyUE', '%boolUE'],
            this.type
        )) {
        suff = ' \u03BB';
    } else if (this.defaultValue) {
        if (this.type === '%n') {
            suff = ' # = ' + this.defaultValue.toString();
        } else if (contains(['%mlt', '%code'], this.type)) {
            suff = ' \u00B6 = ' + this.defaultValue.toString(); // pilcrow
        } else { // 'any' or 'text'
            suff = ' = ' + this.defaultValue.toString();
        }
    } else if (this.type === '%n') {
        suff = ' #';
    } else if (contains(['%mlt', '%code'], this.type)) {
        suff = ' \u00B6'; // pilcrow
    }
    return this.labelString + suff;
};

BlockLabelFragment.prototype.blockSpecFragment = function () {
    // answer a string representing my block spec
    return this.isDeleted ? '' : this.type || this.labelString;
};

BlockLabelFragment.prototype.copy = function () {
    var ans = new BlockLabelFragment(this.labelString);
    ans.type = this.type;
    ans.defaultValue = this.defaultValue;
    ans.options = this.options;
    ans.isReadOnly = this.isReadOnly;
    ans.isIrreplaceable = this.isIrreplaceable;
    ans.separator = this.separator;
    ans.collapse = this.collapse;
    ans.expand = this.expand;
    ans.initialSlots = this.initialSlots;
    ans.minSlots = this.minSlots;
    ans.maxSlots = this.maxSlots;
    return ans;
};

// options and special drop-down menus

BlockLabelFragment.prototype.hasOptions = function () {
    return this.options !== '' && !this.hasSpecialMenu();
};

BlockLabelFragment.prototype.hasSpecialMenu = function () {
    return contains(
        [
            '§_dynamicMenu',
            '§_messagesMenu',
            '§_messagesReceivedMenu',    //for backward (5.0.0 - 5.0.3) support
            '§_objectsMenu',
            '§_costumesMenu',
            '§_soundsMenu',
            '§_getVarNamesDict',
            '§_pianoKeyboardMenu',
            '§_directionDialMenu',
            '§_destinationsMenu',
            '§_locationMenu',
            '§_typesMenu',
            '§_objectsMenuWithSelf',
            '§_clonablesMenu',
            '§_clonablesMenuWithTurtle',
            '§_collidablesMenu',
            '§_keysMenu',
            '§_gettablesMenu',
            '§_attributesMenu',
            '§_audioMenu',
            '§_scenesMenu',
            '§_primitivesMenu',
            '§_extensionsMenu',
            '§_inputSlotsMenu'
        ],
        this.options
    );
};

BlockLabelFragment.prototype.hasExtensionMenu = function () {
    return contains(
        Array.from(SnapExtensions.menus.keys()).map(str => '§_ext_' + str),
        this.options
    );
};

// arity

BlockLabelFragment.prototype.isSingleInput = function () {
    return !this.isMultipleInput() &&
        (this.type !== '%upvar');
};

BlockLabelFragment.prototype.isMultipleInput = function () {
    // answer true if the type begins with '%mult' or '%group'
    if (!this.type) {
        return false; // not an input at all
    }
    return this.type.indexOf('%mult') > -1 ||
        this.type.indexOf('%group') > -1;
};

BlockLabelFragment.prototype.isUpvar = function () {
    if (!this.type) {
        return false; // not an input at all
    }
    return this.type === '%upvar';
};

BlockLabelFragment.prototype.setToSingleInput = function () {
    if (!this.type) {return null; } // not an input at all
    if (this.type === '%upvar') {
        this.type = '%s';
    } else {
        this.type = this.singleInputType();
    }
};

BlockLabelFragment.prototype.setToMultipleInput = function () {
    if (!this.type) {return null; } // not an input at all
    if (this.type === '%upvar') {
        this.type = '%s';
    } else if (['%ca', '%loop'].includes(this.type)) {
        this.type = '%cs';
    }
    this.type = '%mult'.concat(this.singleInputType());
};

BlockLabelFragment.prototype.setToUpvar = function () {
    if (!this.type) {return null; } // not an input at all
    this.type = '%upvar';
};

BlockLabelFragment.prototype.singleInputType = function () {
    // answer the type of my input withtou any preceding '%mult'
    if (!this.type) {
        return null; // not an input at all
    }
    if (this.isMultipleInput()) {
        return this.type.substr(5); // everything following '%mult'
    }
    return this.type;
};

BlockLabelFragment.prototype.setSingleInputType = function (type) {
    if (!this.type || !this.isMultipleInput()) {
        this.type = type;
    } else {
        this.type = '%mult'.concat(type);
    }
};

// BlockLabelFragmentMorph ///////////////////////////////////////////////

/*
    I am a single word in a custom block prototype's label. I can be clicked
    to edit my contents and to turn me into an input placeholder.
*/

// BlockLabelFragmentMorph inherits from Morph:

BlockLabelFragmentMorph.prototype = new Morph();
BlockLabelFragmentMorph.prototype.constructor = BlockLabelFragmentMorph;
BlockLabelFragmentMorph.uber = Morph.prototype;

// BlockLabelFragmentMorph instance creation:

function BlockLabelFragmentMorph(spec, shape) {
    this.init(spec, shape);
}

BlockLabelFragmentMorph.prototype.init = function (spec, shape) {
    BlockLabelFragmentMorph.uber.init.call(this);
    this.spec = spec;
    this.fragment = new BlockLabelFragment(spec);
    this.fragment.type = null;
    this.sO = null; // temporary backup for shadowOffset
    this.shape =  shape; // the actual label part, a StringMorph or SymbolMorph
    this.add(shape);
//    this.fixLayout();
};

BlockLabelFragmentMorph.prototype.fixLayout = function () {
    this.bounds = this.shape.bounds;
};

BlockLabelFragmentMorph.prototype.render = nop;

// BlockLabelFragmentMorph events:

BlockLabelFragmentMorph.prototype.mouseEnter = function () {
    this.sO = this.shape.shadowOffset;
    this.shape.shadowOffset = this.sO.neg();
    this.shape.fixLayout();
    this.shape.rerender();
    this.fixLayout();
};

BlockLabelFragmentMorph.prototype.mouseLeave = function () {
    this.shape.shadowOffset = this.sO;
    this.shape.fixLayout();
    this.shape.rerender();
    this.fixLayout();
};

BlockLabelFragmentMorph.prototype.mouseClickLeft = function () {
/*
    make a copy of my fragment object and open an InputSlotDialog on it.
    If the user acknowledges the DialogBox, assign the - edited - copy
    of the fragment object to be my new fragment object and update the
    custom block'label (the prototype in the block editor). Do not yet update
    the definition and every block instance, as this happens only after
    the user acknowledges and closes the block editor
*/
    var frag = this.fragment.copy(),
        isPlaceHolder = this instanceof BlockLabelPlaceHolderMorph,
        isOnlyElement = this.parent.parseSpec(this.parent.blockSpec).length
            < 2;

    new InputSlotDialogMorph(
        frag,
        null,
        () => this.updateBlockLabel(frag),
        this.spec,
        this.parent.definition.category
    ).open(
        this instanceof BlockLabelFragmentMorph ?
                'Edit label fragment' :
                isPlaceHolder ? 'Create input name' : 'Edit input name',
        frag.labelString,
        this.world(),
        null,
        isPlaceHolder || isOnlyElement
    );
};

BlockLabelFragmentMorph.prototype.updateBlockLabel = function (newFragment) {
    var prot = this.parentThatIsA(BlockMorph);
    this.fragment = newFragment;
    if (prot) {
        prot.refreshPrototype();
    }
};

// BlockLabelPlaceHolderMorph ///////////////////////////////////////////////

/*
    I am a space between words or inputs in a custom block prototype's label.
    When I am moused over I display a plus sign on a colored background
    circle. I can be clicked to add a new word or input to the prototype.
*/

// BlockLabelPlaceHolderMorph inherits from Morph:

BlockLabelPlaceHolderMorph.prototype = new Morph();
BlockLabelPlaceHolderMorph.prototype.constructor = BlockLabelPlaceHolderMorph;
BlockLabelPlaceHolderMorph.uber = Morph.prototype;

// BlockLabelPlaceHolderMorph preferences settings

BlockLabelPlaceHolderMorph.prototype.plainLabel = false; // always show (+)

// BlockLabelPlaceHolderMorph instance creation:

function BlockLabelPlaceHolderMorph() {
    this.init();
}

BlockLabelPlaceHolderMorph.prototype.init = function () {
    this.fragment = new BlockLabelFragment('');
    this.fragment.type = '%s';
    this.fragment.isDeleted = true;
    this.isHighlighted = false;
    BlockLabelFragmentMorph.uber.init.call(this);
};

// BlockLabelPlaceHolderMorph drawing

BlockLabelPlaceHolderMorph.prototype.fixLayout = function () {
    var h = fontHeight(SyntaxElementMorph.prototype.fontSize * 1.4);
    this.bounds.setHeight(h);
    this.bounds.setWidth(
        this.isHighlighted || !this.plainLabel ? h / 2 :
            SyntaxElementMorph.prototype.scale
    );

    // notify my parent of layout change - move to fixLayout()
    if (this.parent) {
        if (this.parent.fixLayout) {
            this.parent.fixLayout();
        }
        if (this.parent.parent instanceof PrototypeHatBlockMorph) {
            this.parent.parent.fixLayout();
        }
    }
};

BlockLabelPlaceHolderMorph.prototype.render = function (ctx) {
    var cx = this.width() / 2,
        cy = this.height() / 2,
        r = Math.min(cx, cy),
        unit = SyntaxElementMorph.prototype.scale;

    // draw background, if any
    if (this.isHighlighted) {
        ctx.fillStyle = this.color.toString();
        ctx.beginPath();
        ctx.arc(
            cx,
            cy,
            r,
            radians(0),
            radians(360),
            false
        );
        ctx.closePath();
        ctx.fill();
    }

    if (!this.plainLabel || this.isHighlighted) {
        ctx.strokeStyle = this.isHighlighted ? 'white' : this.color.toString();
        ctx.lineWidth = unit;
        ctx.beginPath();
        ctx.moveTo(unit, cy);
        ctx.lineTo(r * 2 - unit, cy);
        ctx.moveTo(r, cy - r + unit);
        ctx.lineTo(r, cy + r - unit);
        ctx.stroke();
    }
};

// BlockLabelPlaceHolderMorph events:

BlockLabelPlaceHolderMorph.prototype.mouseEnter = function () {
    var hat = this.parentThatIsA(PrototypeHatBlockMorph);
    this.isHighlighted = true;
    if (this.plainLabel && hat) {
        hat.changed();
        this.fixLayout();
        hat.changed();
    } else {
        this.fixLayout();
        this.rerender();
    }
};

BlockLabelPlaceHolderMorph.prototype.mouseLeave = function () {
    var hat = this.parentThatIsA(PrototypeHatBlockMorph);
    this.isHighlighted = false;
    if (this.plainLabel && hat) {
        hat.changed();
        this.fixLayout();
        hat.changed();
    } else {
        this.fixLayout();
        this.rerender();
    }
};

BlockLabelPlaceHolderMorph.prototype.mouseClickLeft
    = BlockLabelFragmentMorph.prototype.mouseClickLeft;

BlockLabelPlaceHolderMorph.prototype.updateBlockLabel
    = BlockLabelFragmentMorph.prototype.updateBlockLabel;

// BlockInputFragmentMorph ///////////////////////////////////////////////

/*
    I am a variable blob in a custom block prototype's label. I can be clicked
    to edit my contents and to turn me into an part of the block's label text.
*/

// BlockInputFragmentMorph inherits from TemplateSlotMorph:

BlockInputFragmentMorph.prototype = new TemplateSlotMorph();
BlockInputFragmentMorph.prototype.constructor = BlockInputFragmentMorph;
BlockInputFragmentMorph.uber = TemplateSlotMorph.prototype;

// BlockInputFragmentMorph instance creation:

function BlockInputFragmentMorph(text) {
    this.init(text);
}

BlockInputFragmentMorph.prototype.init = function (text) {
    this.fragment = new BlockLabelFragment(text);
    this.fragment.type = '%s';
    BlockInputFragmentMorph.uber.init.call(this, text);
};

// BlockInputFragmentMorph events:

BlockInputFragmentMorph.prototype.mouseClickLeft
    = BlockLabelFragmentMorph.prototype.mouseClickLeft;

BlockInputFragmentMorph.prototype.updateBlockLabel
    = BlockLabelFragmentMorph.prototype.updateBlockLabel;

// InputSlotDialogMorph ////////////////////////////////////////////////

// ... "inherits" some methods from BlockDialogMorph

// InputSlotDialogMorph inherits from DialogBoxMorph:

InputSlotDialogMorph.prototype = new DialogBoxMorph();
InputSlotDialogMorph.prototype.constructor = InputSlotDialogMorph;
InputSlotDialogMorph.uber = DialogBoxMorph.prototype;

// InputSlotDialogMorph preferences settings:

// if "isLaunchingExpanded" is true I always open in the long form
InputSlotDialogMorph.prototype.isLaunchingExpanded = false;

// InputSlotDialogMorph instance creation:

function InputSlotDialogMorph(
    fragment,
    target,
    action,
    environment,
    category
) {
    this.init(fragment, target, action, environment, category);
}

InputSlotDialogMorph.prototype.init = function (
    fragment,
    target,
    action,
    environment,
    category
) {
    var scale = SyntaxElementMorph.prototype.scale,
        fh = fontHeight(10) / 1.2 * scale; // "raw height"

    // additional properties:
    this.fragment = fragment || new BlockLabelFragment();
    this.textfield = null;
    this.types = null;
    this.slots = null;
    this.isExpanded = false;
    this.category = category || 'other';
    this.noDelete = false;

    // initialize inherited properties:
    BlockDialogMorph.uber.init.call(
        this,
        target,
        action,
        environment
    );

    // override inherited properites:
    this.types = new AlignmentMorph('row', this.padding);
    this.types.respectHiddens = true; // prevent the arrow from flipping
    this.add(this.types);
    this.slots = new BoxMorph();
    this.slots.color = new Color(55, 55, 55); // same as palette
    this.slots.borderColor = this.slots.color.lighter(50);
    this.slots.setExtent(new Point((fh + 10) * 24, (fh + 10 * scale) * 10.4));
    this.add(this.slots);
    this.createSlotTypeButtons();
    this.fixSlotsLayout();
    this.addSlotsMenu();
    this.createTypeButtons();
    this.fixLayout();
};

InputSlotDialogMorph.prototype.createTypeButtons = function () {
    var block,
        arrow,
        clr = SpriteMorph.prototype.blockColorFor(this.category);


    block = new JaggedBlockMorph(localize('Title text'));
    block.setColor(clr);
    this.addBlockTypeButton(
        () => this.setType(null),
        block,
        () => this.fragment.type === null
    );

    block = new JaggedBlockMorph('%inputName');
    block.setColor(clr);
    this.addBlockTypeButton(
        () => this.setType('%s'),
        block,
        () => this.fragment.type !== null
    );

    // add an arrow button for long form/short form toggling
    arrow = new ArrowMorph(
        'right',
        PushButtonMorph.prototype.fontSize + 4,
        2
    );
    arrow.noticesTransparentClick = true;
    this.types.add(arrow);
    this.types.fixLayout();

    // configure arrow button
    arrow.refresh = (initial) => {
        if (this.fragment.type === null) {
            this.isExpanded = false;
            arrow.hide();
        } else {
            arrow.show();
            if (initial || this.isExpanded) {
                arrow.direction = 'down';
            } else {
                arrow.direction = 'right';
            }
            arrow.fixLayout();
            arrow.rerender();
        }
    };

    arrow.mouseClickLeft = () => {
        if (arrow.isVisible) {
            this.isExpanded = !this.isExpanded;
            this.types.children.forEach(c => c.refresh());
            this.changed();
            this.fixLayout();
            this.rerender();
            this.edit();
        }
    };

    arrow.refresh(this.isLaunchingExpanded);
};

InputSlotDialogMorph.prototype.addTypeButton
    = BlockDialogMorph.prototype.addTypeButton;

InputSlotDialogMorph.prototype.addBlockTypeButton
    = BlockDialogMorph.prototype.addBlockTypeButton;

InputSlotDialogMorph.prototype.setType = function (fragmentType) {
    this.textfield.choices = fragmentType ? null : this.symbolMenu;
    this.textfield.fixLayout();
    this.fragment.type = fragmentType || null;
    this.types.children.forEach(c => c.refresh());
    this.slots.children.forEach(c => c.refresh());
    this.isExpanded = this.isExpanded ||
        (!isNil(fragmentType) && this.isLaunchingExpanded);
    this.types.children.forEach(c => c.refresh());
    this.changed();
    this.fixLayout();
    this.keepWithin(this.world());
    this.rerender();
    this.edit();
};

InputSlotDialogMorph.prototype.getInput = function () {
    var lbl;
    if (this.body instanceof InputFieldMorph) {
        lbl = this.normalizeSpaces(this.body.getValue());
    }
    if (lbl) {
        this.fragment.labelString = lbl;
        if (contains(['%b', '%boolUE'], this.fragment.type)) {
            this.fragment.defaultValue =
                this.slots.defaultSwitch.evaluate();
        } else if (this.fragment.type === '%clr') {
            this.fragment.defaultValue =
                this.slots.defaultPicker.evaluate().toString();
        } else if (this.slots.defaultInputField.isVisible) {
            this.fragment.defaultValue =
                this.slots.defaultInputField.getValue();
        }
        return lbl;
    }
    // otherwise remove the fragment
    this.fragment.isDeleted = true;
    return null;
};

InputSlotDialogMorph.prototype.fixLayout = function () {
    var maxWidth,
        left = this.left(),
        th = fontHeight(this.titleFontSize) + this.titlePadding * 2;

    if (!this.isExpanded) {
        if (this.slots) {
            this.slots.hide();
        }
        return BlockDialogMorph.prototype.fixLayout.call(this);
    }

    this.slots.show();
    maxWidth = this.slots.width();

    // arrange panes :
    // body (input field)
    this.body.setPosition(this.position().add(new Point(
        this.padding + (maxWidth - this.body.width()) / 2,
        th + this.padding
    )));

    // label
    this.label.setLeft(
        left + this.padding + (maxWidth - this.label.width()) / 2
    );
    this.label.setTop(this.top() + (th - this.label.height()) / 2);

    // types
    this.types.fixLayout();
    this.types.setTop(this.body.bottom() + this.padding);
    this.types.setLeft(
        left + this.padding + (maxWidth - this.types.width()) / 2
    );

    // slots
    this.slots.setPosition(new Point(
        this.left() + this.padding,
        this.types.bottom() + this.padding
    ));
    this.slots.children.forEach(c => c.refresh());

    // buttons
    this.buttons.fixLayout();
    this.buttons.setTop(this.slots.bottom() + this.padding);
    this.buttons.setLeft(
        left + this.padding + (maxWidth - this.buttons.width()) / 2
    );

    // set dialog box dimensions:
    this.bounds.setHeight(this.buttons.bottom() - this.top() + this.padding);
    this.bounds.setWidth(this.slots.right() - this.left() + this.padding);

    // refresh a shallow shadow
    this.removeShadow();
    this.addShadow();
};

InputSlotDialogMorph.prototype.open = function (
    title,
    defaultString,
    world,
    pic,
    noDeleteButton
) {
    var txt = new InputFieldMorph(defaultString);

    if (!this.fragment.type) {
        txt.choices = this.symbolMenu;
    }
    this.isExpanded = !isNil(this.fragment.type) && this.isLaunchingExpanded;
    txt.setWidth(250);
    this.labelString = title;
    this.createLabel();
    if (pic) {this.setPicture(pic); }
    this.addBody(txt);
    this.textfield = txt;
    this.addButton('ok', 'OK');
    if (!noDeleteButton) {
        this.addButton('deleteFragment', 'Delete');
    } else {
        this.noDelete = true;
    }
    this.addButton('cancel', 'Cancel');
    this.fixLayout();
    this.popUp(world);
    this.add(this.types); // make the types come to front
    this.changed();
};

InputSlotDialogMorph.prototype.symbolMenu = function () {
    var symbols = [],
        symbolColor = new Color(100, 100, 130);
    SymbolMorph.prototype.names.forEach(sym =>
        symbols.push([
            [
                new SymbolMorph(sym, this.fontSize, symbolColor),
                localize(sym)
            ],
            '$' + sym
        ])
    );
    symbols.push(['\u23CE ' + localize('new line'), '$nl']);
    return symbols;
};

InputSlotDialogMorph.prototype.deleteFragment = function () {
    this.fragment.isDeleted = true;
    this.accept();
};

InputSlotDialogMorph.prototype.createSlotTypeButtons = function () {
    // populate my 'slots' area with radio buttons, labels and input fields
    var defLabel, defInput, defSwitch, defPicker, loopArrow, settingsButton;

    // slot types
    this.addSlotTypeButton('Color', '%clr');
    this.addSlotTypeButton('Text', '%txt');
    this.addSlotTypeButton('List', '%l');
    this.addSlotTypeButton('Number', '%n');
    this.addSlotTypeButton('Any type', '%s');
    this.addSlotTypeButton('Boolean (T/F)', '%b');
    this.addSlotTypeButton('Command\n(inline)', '%cmdRing'); //'%cmd');
    this.addSlotTypeButton('Reporter', '%repRing'); //'%r');
    this.addSlotTypeButton('Predicate', '%predRing'); //'%p');
    this.addSlotTypeButton('Command\n(C-shape)', ['%cs', '%ca', '%loop']);
    this.addSlotTypeButton('Any\n(unevaluated)', '%anyUE');
    this.addSlotTypeButton('Boolean\n(unevaluated)', '%boolUE');

    // arity and upvars
    this.slots.radioButtonSingle = this.addSlotArityButton(
        () => this.setSlotArity('single'),
        "Single input.",
        () => this.fragment.isSingleInput()
    );
    this.addSlotArityButton(
        () => this.setSlotArity('multiple'),
        "Multiple inputs (value is list of inputs)",
        () => this.fragment.isMultipleInput()
    );
    this.addSlotArityButton(
        () => this.setSlotArity('upvar'),
        "Upvar - make internal variable visible to caller",
        () => this.fragment.isUpvar()
    );

    // default values
    defLabel = new StringMorph(localize('Default Value:'));
    defLabel.fontSize = this.slots.radioButtonSingle.fontSize;
    defLabel.setColor(WHITE);
    defLabel.refresh = () => {
        if (this.isExpanded && contains(
                [
                    '%s', '%n', '%txt', '%anyUE', '%b', '%boolUE',
                    '%mlt', '%code', '%upvar', '%clr'
                ],
                this.fragment.type
            )) {
            defLabel.changed();
            defLabel.text = this.fragment.type === '%upvar' ?
                localize('Default Name:')
                : localize('Default Value:');
            defLabel.fixLayout();
            defLabel.rerender();
            defLabel.show();
        } else {
            defLabel.hide();
        }
    };
    this.slots.defaultInputLabel = defLabel;
    this.slots.add(defLabel);

    defInput = new InputFieldMorph(this.fragment.defaultValue);
    defInput.contents().fontSize = defLabel.fontSize;
    defInput.contrast = 90;
    defInput.setWidth(50);
    defInput.refresh = () => {
        if (this.isExpanded && contains(
            ['%s', '%n', '%txt', '%anyUE', '%mlt', '%code', '%upvar'],
            this.fragment.type
        )) {
            defInput.show();
            if (this.fragment.type === '%n') {
                defInput.setIsNumeric(true);
            } else {
                defInput.setIsNumeric(false);
            }
        } else {
            defInput.hide();
        }
    };
    this.slots.defaultInputField = defInput;
    this.slots.add(defInput);

    defSwitch = new BooleanSlotMorph(this.fragment.defaultValue);
    defSwitch.refresh = () => {
        if (this.isExpanded && contains(
            ['%b', '%boolUE'],
            this.fragment.type
        )) {
            defSwitch.show();
        } else {
            defSwitch.hide();
        }
    };
    this.slots.defaultSwitch = defSwitch;
    this.slots.add(defSwitch);

    defPicker = new ColorSlotMorph(this.fragment.defaultValue);
    defPicker.refresh = () => {
        if (this.isExpanded && this.fragment.type === '%clr') {
            defPicker.show();
        } else {
            defPicker.hide();
        }
    };
    this.slots.defaultPicker = defPicker;
    this.slots.add(defPicker);

    // loop arrow checkbox //
    loopArrow = new ToggleMorph(
        'checkbox',
        this, // target
        () => { // action
            if (['%ca', '%loop'].includes(this.fragment.type)) {
                this.setType('%cs');
            } else {
                this.setType('%ca');
            }
        },
        null, // label string
        () => ['%ca', '%loop'].includes(this.fragment.type),
        null, // environment
        null, // hint
        new SymbolMorph(
            'loop',
            this.fontSize * 0.7,
            WHITE
        ).getImage(),
        null // builder method that constructs the element morph
    );
    loopArrow.refresh = () => {
        ToggleMorph.prototype.refresh.call(loopArrow);
        if (this.isExpanded && contains(
                ['%cs', '%ca', '%loop'],
                this.fragment.type
            )) {
            loopArrow.show();
        } else {
            loopArrow.hide();
        }
    };
    this.slots.loopArrow = loopArrow;
    this.slots.add(loopArrow);

    // settings button
    settingsButton = new PushButtonMorph(
        this.slots,
        () => this.slots.userMenu().popUpAtHand(this.world()),
        new SymbolMorph('gearPartial', this.fontSize * 1.5)
    );
    settingsButton.padding = 0;
    settingsButton.fixLayout();
    settingsButton.refresh = nop;
    this.slots.settingsButton = settingsButton;
    this.slots.add(settingsButton);

};

InputSlotDialogMorph.prototype.setSlotType = function (type) {
    this.fragment.setSingleInputType(type);
    this.slots.children.forEach(c => c.refresh());
    this.edit();
};

InputSlotDialogMorph.prototype.setSlotArity = function (arity) {
    if (arity === 'single') {
        this.fragment.setToSingleInput();
    } else if (arity === 'multiple') {
        this.fragment.setToMultipleInput();
    } else if (arity === 'upvar') {
        this.fragment.setToUpvar();
        // hide other options - under construction
    }
    this.slots.children.forEach(c => c.refresh());
    this.edit();
};

InputSlotDialogMorph.prototype.setSlotOptions = function (text) {
    this.fragment.options = text;
};

InputSlotDialogMorph.prototype.addSlotTypeButton = function (
    label,
    spec // slot spec or array of specs (I *hate* the arrow symbol, -Jens)
) {
/*
    this method produces a radio button with a picture of the
    slot type indicated by "spec" and the "label" text to
    its right.
    Note that you can make the slot picture interactive (turn
    it into a ToggleElementMorph by changing the

        element.fullImage()

    line to just

        element

    I've opted for the simpler representation because it reduces
    the duration of time it takes for the InputSlotDialog to load
    and show. But in the future computers and browsers may be
    faster.
*/
    var action = () => {
            this.setSlotType(spec instanceof Array ? spec[0] : spec);
        },
        query,
        element = new JaggedBlockMorph(spec instanceof Array ? spec[0] : spec),
        button;

    query = () => {
        return spec instanceof Array ?
            contains(spec, this.fragment.singleInputType())
            : this.fragment.singleInputType() === spec;
    };
    element.setCategory(this.category);
    element.rebuild();
    button = new ToggleMorph(
        'radiobutton',
        this,
        action,
        label,
        query,
        null,
        null,
        element.doWithAlpha(1, () => element.fullImage()),
        'rebuild'
    );
    button.edge = this.buttonEdge / 2;
    button.outline = this.buttonOutline / 2;
    button.outlineColor = this.buttonOutlineColor;
    button.outlineGradient = this.buttonOutlineGradient;
    button.fixLayout();
    button.label.isBold = false;
    button.label.setColor(WHITE);
    this.slots.add(button);
    return button;
};

InputSlotDialogMorph.prototype.addSlotArityButton = function (
    action,
    label,
    query
) {
    var button = new ToggleMorph(
        'radiobutton',
        this,
        action,
        label,
        query,
        null,
        null
    );
    button.edge = this.buttonEdge / 2;
    button.outline = this.buttonOutline / 2;
    button.outlineColor = this.buttonOutlineColor;
    button.outlineGradient = this.buttonOutlineGradient;

    button.fixLayout();
    // button.label.isBold = false;
    button.label.setColor(WHITE);
    this.slots.add(button);
    return button;
};

InputSlotDialogMorph.prototype.fixSlotsLayout = function () {
    var slots = this.slots,
        scale = SyntaxElementMorph.prototype.scale,
        xPadding = 10 * scale,
        ypadding = 14 * scale,
        bh = (fontHeight(10) / 1.2 + 15) * scale, // slot type button height
        ah = (fontHeight(10) / 1.2 + 10) * scale, // arity button height
        size = 12, // number slot type radio buttons
        cols = [
            slots.left() + xPadding,
            slots.left() + slots.width() / 3,
            slots.left() + slots.width() * 2 / 3
        ],
        rows = [
            slots.top() + ypadding,
            slots.top() + ypadding + bh,
            slots.top() + ypadding + bh * 2,
            slots.top() + ypadding + bh * 3,
            slots.top() + ypadding + bh * 4,
            slots.top() + ypadding + bh * 5,

            slots.top() + ypadding + bh * 5 + ah,
            slots.top() + ypadding + bh * 5 + ah * 2
        ],
        idx,
        row = -1,
        col;

    // slot types:

    for (idx = 0; idx < size; idx += 1) {
        col = idx % 3;
        if (idx % 3 === 0) {row += 1; }
        slots.children[idx].setPosition(new Point(
            cols[col],
            rows[row]
        ));
    }

    // arity:

    col = 0;
    row = 5;
    for (idx = size; idx < size + 3; idx += 1) {
        slots.children[idx].setPosition(new Point(
            cols[col],
            rows[row + idx - size]
        ));
    }

    // default input

    this.slots.defaultInputLabel.setPosition(
        this.slots.radioButtonSingle.label.topRight().add(new Point(5, 0))
    );
    this.slots.defaultInputField.setCenter(
        this.slots.defaultInputLabel.center().add(new Point(
            this.slots.defaultInputField.width() / 2
                + this.slots.defaultInputLabel.width() / 2 + 5,
            0
        ))
    );
    this.slots.defaultSwitch.setCenter(
        this.slots.defaultInputLabel.center().add(new Point(
            this.slots.defaultSwitch.width() / 2
                + this.slots.defaultInputLabel.width() / 2 + 5,
            0
        ))
    );

    this.slots.defaultPicker.setCenter(
        this.slots.defaultInputLabel.center().add(new Point(
            this.slots.defaultPicker.width() / 2
                + this.slots.defaultInputLabel.width() / 2 + 5,
            0
        ))
    );

    // loop arrow

    this.slots.loopArrow.setPosition(this.slots.defaultInputLabel.position());
    this.slots.settingsButton.setPosition(
        this.slots.bottomRight().subtract(
            this.slots.settingsButton.extent().add(
                this.padding + this.slots.border
            )
        )
    );

    this.slots.changed();
};

InputSlotDialogMorph.prototype.addSlotsMenu = function () {
    this.slots.userMenu = () => {
        var menu = new MenuMorph(this),
            on = '\u2611 ',
            off = '\u2610 ',
            isEditable = contains(
                ['%s', '%n', '%txt', '%anyUE', '%mlt', '%code'],
                this.fragment.type
            );
        if(this.fragment.type === '%upvar') {
            return this.specialSlotsMenu();
        }
        if (isEditable) {
            menu.addItem(
                (this.fragment.hasOptions() ? on : off) +
                    localize('options') +
                    '...',
                'editSlotOptions'
            );
            menu.addItem(
                (this.fragment.isReadOnly ? on : off) +
                    localize('read-only'),
                () => this.fragment.isReadOnly = !this.fragment.isReadOnly
            );
        }
        menu.addItem(
            (this.fragment.isIrreplaceable ? on : off) +
                localize('static'),
            () => this.fragment.isIrreplaceable =
                !this.fragment.isIrreplaceable
        );
        menu.addLine();
        if (isEditable) {
            menu.addMenu(
                (this.fragment.hasSpecialMenu() ? on : off) +
                    localize('menu'),
                this.specialOptionsMenu()
            );
        }
        if (this.fragment.type.includes('%mult') ||
            this.fragment.type.includes('%group')
        ) {
            menu.addItem(
                (this.fragment.separator ? on : off) +
                    localize('separator') +
                    '...',
                'editSeparator'
            );
            menu.addItem(
                (this.fragment.collapse ? on : off) +
                    localize('collapse') +
                    '...',
                'editCollapse'
            );
            menu.addItem(
                (this.fragment.expand ? on : off) +
                    localize('expand') +
                    '...',
                'editExpand'
            );
            menu.addItem(
                (this.fragment.defaultValue ? on : off) +
                    localize('defaults') +
                    '...',
                'editVariadicDefaults'
            );
            menu.addItem(
                (this.fragment.initialSlots ? on : off) +
                    localize('initial slots') +
                    '...',
                'editVariadicInitialSlots'
            );
            menu.addItem(
                (this.fragment.minSlots ? on : off) +
                    localize('min slots') +
                    '...',
                'editVariadicMinSlots'
            );
            menu.addItem(
                (this.fragment.maxSlots ? on : off) +
                    localize('max slots') +
                    '...',
                'editVariadicMaxSlots'
            );
            menu.addItem(
                (this.fragment.type.includes('%group') ? on : off) +
                    localize('group') +
                    '...',
                'editVariadicGroup'
            );
            menu.addLine();
        }
        menu.addMenu(
            (contains(
                ['%mlt', '%code', '%obj', '%scriptVars', '%receive', '%send',
                    '%elseif'],
                this.fragment.type
            ) ? on : off) +
            localize('special'),
            this.specialSlotsMenu()
        );
        if (this.world().currentKey === 16) { // shift-key down
            menu.addMenu(
                (this.fragment.hasExtensionMenu() ? on : off) +
                localize('extension'),
                this.extensionOptionsMenu()
            );
        }
        return menu;
    };
};

InputSlotDialogMorph.prototype.editSlotOptions = function () {
    new DialogBoxMorph(
        this,
        options => this.fragment.options = options.trim(),
        this
    ).promptCode(
        'Input Slot Options',
        this.fragment.options,
        this.world(),
        null,
        localize('Enter one option per line.\n' +
            'Optionally use "=" as key/value delimiter ' +
            'and {} for submenus. ' +
            'e.g.\n   the answer=42')
    );
};

InputSlotDialogMorph.prototype.specialSlotsMenu = function () {
    var menu = new MenuMorph(this.setSlotType, null, this),
        myself = this,
        on = '\u26AB ',
        off = '\u26AA ';

    function addSpecialSlotType(label, spec) {
        menu.addItem(
            (myself.fragment.type === spec ? on : off) + localize(label),
            spec
        );
    }

    addSpecialSlotType('multi-line', '%mlt');
    addSpecialSlotType('code', '%code');
    addSpecialSlotType('object', '%obj');
    menu.addLine();
    addSpecialSlotType('variables', '%scriptVars');
    addSpecialSlotType('receivers', '%receive');
    addSpecialSlotType('send data', '%send');
    addSpecialSlotType('conditionals', '%elseif');
    return menu;
};

InputSlotDialogMorph.prototype.specialOptionsMenu = function () {
    var menu = new MenuMorph(this.setSlotOptions, null, this),
        myself = this,
        on = '\u26AB ',
        off = '\u26AA ';

    function addSpecialOptions(label, selector) {
        menu.addItem(
            (myself.fragment.options === selector ?
                    on : off) + localize(label),
            selector
        );
    }

    addSpecialOptions('(none)', '');
    addSpecialOptions('scripted', '§_dynamicMenu');
    menu.addLine();
    addSpecialOptions('messages', '§_messagesMenu');
    addSpecialOptions('objects', '§_objectsMenu');
    addSpecialOptions('data types', '§_typesMenu');
    addSpecialOptions('costumes', '§_costumesMenu');
    addSpecialOptions('sounds', '§_soundsMenu');
    addSpecialOptions('variables', '§_getVarNamesDict');
    addSpecialOptions('piano keyboard', '§_pianoKeyboardMenu');
    addSpecialOptions('360° dial', '§_directionDialMenu');
    menu.addLine();
    addSpecialOptions('destinations', '§_destinationsMenu');
    addSpecialOptions('locations', '§_locationMenu');
    addSpecialOptions('keys', '§_keysMenu');
    addSpecialOptions('objects + self', '§_objectsMenuWithSelf');
    addSpecialOptions('sprites + self', '§_clonablesMenu');
    addSpecialOptions('sprites + turtle', '§_clonablesMenuWithTurtle');
    addSpecialOptions('collidables', '§_collidablesMenu');
    addSpecialOptions('object attributes', '§_gettablesMenu');
    addSpecialOptions('properties', '§_attributesMenu');
    addSpecialOptions('scenes', '§_scenesMenu');
    addSpecialOptions('microphone', '§_audioMenu');
    addSpecialOptions('primitives', '§_primitivesMenu');
    addSpecialOptions('extensions', '§_extensionsMenu');
    addSpecialOptions('input slots', '§_inputSlotsMenu');
    return menu;
};

InputSlotDialogMorph.prototype.extensionOptionsMenu = function () {
    var menu = new MenuMorph(this.setSlotOptions, null, this),
        myself = this,
        selectors = Array.from(SnapExtensions.menus.keys()),
        on = '\u26AB ',
        off = '\u26AA ';

    function addSpecialOptions(label, selector) {
        menu.addItem(
            (myself.fragment.options === selector ?
                    on : off) + localize(label),
            selector
        );
    }

    selectors.forEach(sel => {
        addSpecialOptions(sel.slice(4), '§_ext_' + sel);
    });
    return menu;
};

InputSlotDialogMorph.prototype.editSeparator = function () {
        new DialogBoxMorph(
            this,
            str => this.fragment.separator = str,
            this
        ).prompt(
            "Separator",
            this.fragment.separator || '',
            this.world()
        );
};

InputSlotDialogMorph.prototype.editCollapse = function () {
        new DialogBoxMorph(
            this,
            str => this.fragment.collapse = str,
            this
        ).prompt(
            "Collapse",
            this.fragment.collapse || '',
            this.world()
        );
};

InputSlotDialogMorph.prototype.editExpand = function () {
    new DialogBoxMorph(
        this,
        str => this.fragment.expand = str,
        this
    ).promptCode(
        "Expand",
        this.fragment.expand || '',
        this.world(),
        null,
        localize('Enter one item per line.')
    );
};

InputSlotDialogMorph.prototype.editVariadicDefaults = function () {
    new DialogBoxMorph(
        this,
        str => this.fragment.defaultValue = str,
        this
    ).promptCode(
        "Defaults",
        this.fragment.defaultValue || '',
        this.world(),
        null,
        localize('Enter one item per line.')
    );
};

InputSlotDialogMorph.prototype.editVariadicInitialSlots = function () {
    new DialogBoxMorph(
        this,
        num => this.fragment.initialSlots = Math.min(num, 12),
        this
    ).prompt(
        "Initial slots",
        (this.fragment.initialSlots || 0).toString(),
        this.world(),
        null, // pic
        { // choices
            '0': 0,
            '1': 1,
            '2': 2,
            '3': 3
        },
        false, // read-only?
        true, // numeric
        0, // slider-min
        3, // slider-max
        null, // slider-action
        0 // decimals
    );
};

InputSlotDialogMorph.prototype.editVariadicMinSlots = function () {
    new DialogBoxMorph(
        this,
        num => this.fragment.minSlots = Math.min(num, 12),
        this
    ).prompt(
        "Min slots",
        (this.fragment.minSlots || 0).toString(),
        this.world(),
        null, // pic
        { // choices
            '0': 0,
            '1': 1,
            '2': 2,
            '3': 3
        },
        false, // read-only?
        true, // numeric
        0, // slider-min
        3, // slider-max
        null, // slider-action
        0 // decimals
    );
};

InputSlotDialogMorph.prototype.editVariadicMaxSlots = function () {
    new DialogBoxMorph(
        this,
        num => this.fragment.maxSlots = num,
        this
    ).prompt(
        "Max slots",
        (this.fragment.maxSlots || 0).toString(),
        this.world(),
        null, // pic
        { // choices
            '0': 0,
            '1': 1,
            '2': 2,
            '3': 3,
            '4': 4,
            '5': 5,
            '6': 6,
            '7': 7,
            '8': 8,
            '9': 9,
        },
        false, // read-only?
        true, // numeric
        0, // slider-min
        20, // slider-max
        null, // slider-action
        0 // decimals
    );
};

InputSlotDialogMorph.prototype.editVariadicGroup = function () {
    new DialogBoxMorph(
        this,
        str => {
            let slots = str.split('\n');
            this.fragment.type = '%group' + slots.map(
                each => Process.prototype.slotSpec(
                    Process.prototype.slotType(each.trim())
                )
            ).join('');
            this.fragment.initialSlots = Math.min(slots.length, 12);
        },
        this
    ).promptCode(
        "Input group",
        this.fragment.type.split('%').slice(2).map(each =>
            Process.prototype.slotType(each.trim())
        ).join('\n'),
        this.world(),
        null, // pic
        localize('Enter one item per line.')
    );
};

// InputSlotDialogMorph hiding and showing:

/*
    override the inherited behavior to recursively hide/show all
    children, so that my instances get restored correctly when
    hiding/showing my parent.
*/

InputSlotDialogMorph.prototype.hide = function () {
    this.isVisible = false;
    this.changed();
};

InputSlotDialogMorph.prototype.show = function () {
    this.isVisible = true;
    this.changed();
};

// VariableDialogMorph ////////////////////////////////////////////////////

// VariableDialogMorph inherits from DialogBoxMorph:

VariableDialogMorph.prototype = new DialogBoxMorph();
VariableDialogMorph.prototype.constructor = VariableDialogMorph;
VariableDialogMorph.uber = DialogBoxMorph.prototype;

// ... and some behavior from BlockDialogMorph

// VariableDialogMorph instance creation:

function VariableDialogMorph(target, action, environment) {
    this.init(target, action, environment);
}

VariableDialogMorph.prototype.init = function (target, action, environment) {
    // additional properties:
    this.types = null;
    this.isGlobal = true;

    // initialize inherited properties:
    BlockDialogMorph.uber.init.call(
        this,
        target,
        action,
        environment
    );

    // override inherited properites:
    this.types = new AlignmentMorph('row', this.padding);
    this.add(this.types);
    this.createTypeButtons();
};

VariableDialogMorph.prototype.createTypeButtons = function () {
    this.addTypeButton(
        () => this.setType('global'),
        "for all sprites",
        () => this.isGlobal
    );
    this.addTypeButton(
        () => this.setType('local'),
        "for this sprite only",
        () => !this.isGlobal
    );
};

VariableDialogMorph.prototype.addTypeButton
    = BlockDialogMorph.prototype.addTypeButton;

VariableDialogMorph.prototype.setType = function (varType) {
    this.isGlobal = (varType === 'global');
    this.types.children.forEach(c => c.refresh());
    this.edit();
};

VariableDialogMorph.prototype.getInput = function () {
    // answer a tuple: [varName, isGlobal]
    var name = this.normalizeSpaces(this.body.getValue());
    return name ? [name, this.isGlobal] : null;
};

VariableDialogMorph.prototype.fixLayout = function () {
    var th = fontHeight(this.titleFontSize) + this.titlePadding * 2;

    if (this.body) {
        this.body.setPosition(this.position().add(new Point(
            this.padding,
            th + this.padding
        )));
        this.bounds.setWidth(this.body.width() + this.padding * 2);
        this.bounds.setHeight(
            this.body.height()
                + this.padding * 2
                + th
        );
    }

    if (this.label) {
        this.label.setCenter(this.center());
        this.label.setTop(this.top() + (th - this.label.height()) / 2);
    }

    if (this.types) {
        this.types.fixLayout();
        this.bounds.setHeight(
            this.height()
                    + this.types.height()
                    + this.padding
        );
        this.bounds.setWidth(Math.max(
            this.width(),
            this.types.width() + this.padding * 2
        ));
        this.types.setCenter(this.center());
        if (this.body) {
            this.types.setTop(this.body.bottom() + this.padding);
        } else if (this.categories) {
            this.types.setTop(this.categories.bottom() + this.padding);
        }
    }

    if (this.buttons && (this.buttons.children.length > 0)) {
        this.buttons.fixLayout();
        this.bounds.setHeight(
            this.height()
                    + this.buttons.height()
                    + this.padding
        );
        this.buttons.setCenter(this.center());
        this.buttons.setBottom(this.bottom() - this.padding);
    }

    // refresh a shallow shadow
    this.removeShadow();
    this.addShadow();
};

// BlockExportDialogMorph ////////////////////////////////////////////////////

// BlockExportDialogMorph inherits from DialogBoxMorph:

BlockExportDialogMorph.prototype = new DialogBoxMorph();
BlockExportDialogMorph.prototype.constructor = BlockExportDialogMorph;
BlockExportDialogMorph.uber = DialogBoxMorph.prototype;

// BlockExportDialogMorph constants:

BlockExportDialogMorph.prototype.key = 'blockExport';

// BlockExportDialogMorph instance creation:

function BlockExportDialogMorph(serializer, blocks, target) {
    this.init(serializer, blocks, target);
}

BlockExportDialogMorph.prototype.init = function (serializer, blocks, target) {
    // additional properties:
    this.serializer = serializer;
    this.blocks = blocks.slice(0);
    this.globalData = null; // forked global var frame with data dependencies
    this.localData = null; // forked local var frame with data dependencies
    this.globalVarNames = null;
    this.localVarNames = null;
    this.handle = null;

    // initialize inherited properties:
    BlockExportDialogMorph.uber.init.call(
        this,
        target, // target
        () => this.exportBlocks(),
        null // environment
    );

    // override inherited properites:
    this.labelString = 'Export blocks';
    this.createLabel();

    // determine data dependencies
    this.collectDataDependencies();

    // build contents
    this.buildContents();
};

BlockExportDialogMorph.prototype.collectDataDependencies = function () {
    var names = [];

    // collect names of all data dependencies
    this.blocks.forEach(def =>
        def.dataDependencies().forEach(name => {
            if (!names.includes(name)) {
                names.push(name);
            }
        })
    );

    // collect sprite-local data dependencies
    this.localData = this.target.currentSprite.variables.fork(names);
    this.localVarNames = this.localData.names(true).sort(); // include hidden

    // collect remaining global data dependencies
    names = names.filter(name => !this.localVarNames.includes(name));
    this.globalData = this.target.stage.globalVariables().fork(names);
    this.globalVarNames = this.globalData.names(true).sort(); // include hidden
};

BlockExportDialogMorph.prototype.buildContents = function () {
    var palette, x, y, block, checkBox, lastCat,
        padding = 4,
        bootstrapped = SpriteMorph.prototype.bootstrappedBlocks();

    // create plaette
    palette = new ScrollFrameMorph(
        null,
        null,
        SpriteMorph.prototype.sliderColor
    );
    palette.color = SpriteMorph.prototype.paletteColor;
    palette.padding = padding;
    palette.isDraggable = false;
    palette.acceptsDrops = false;
    palette.contents.acceptsDrops = false;

    // populate palette
    x = palette.left() + padding;
    y = palette.top() + padding;

    // - create selectors for global variables
    this.globalVarNames.forEach(vName => {
        block = SpriteMorph.prototype.variableBlock(vName);
        block.isDraggable = false;
        block.isTemplate = true;
        block.isToggleLabel = true; // mark as unrefreshable label
        checkBox = new ToggleMorph(
            'checkbox',
            this,
            () => {
                var idx = this.globalVarNames.indexOf(vName);
                if (idx > -1) {
                    this.globalVarNames.splice(idx, 1);
                } else {
                    this.globalVarNames.push(vName);
                }
            },
            null,
            () => contains(this.globalVarNames, vName),
            null,
            null,
            this.target ? block : block.fullImage()
        );
        checkBox.setPosition(new Point(
            x,
            y + (checkBox.top() - checkBox.toggleElement.top())
        ));
        palette.addContents(checkBox);
        y += checkBox.fullBounds().height() + padding;
    });
    y += padding;

    // - create selectors for local variables
    this.localVarNames.forEach(vName => {
        block = SpriteMorph.prototype.variableBlock(vName, true); // isLocal
        block.isDraggable = false;
        block.isTemplate = true;
        block.isToggleLabel = true; // mark as unrefreshable label
        checkBox = new ToggleMorph(
            'checkbox',
            this,
            () => {
                var idx = this.localVarNames.indexOf(vName);
                if (idx > -1) {
                    this.localVarNames.splice(idx, 1);
                } else {
                    this.localVarNames.push(vName);
                }
            },
            null,
            () => contains(this.localVarNames, vName),
            null,
            null,
            this.target ? block : block.fullImage()
        );
        checkBox.setPosition(new Point(
            x,
            y + (checkBox.top() - checkBox.toggleElement.top())
        ));
        palette.addContents(checkBox);
        y += checkBox.fullBounds().height() + padding;
    });
    y += padding;

    // - create selectors for blocks
    SpriteMorph.prototype.allCategories().forEach(category => {
        this.blocks.forEach(definition => {
            if (definition.category === category) {
                if (lastCat && (category !== lastCat)) {
                    y += padding;
                }
                lastCat = category;
                block = definition.templateInstance();
                block.isToggleLabel = true; // mark as unrefreshable label
                checkBox = new ToggleMorph(
                    'checkbox',
                    this,
                    () => {
                        var idx = this.blocks.indexOf(definition);
                        if (idx > -1) {
                            this.blocks.splice(idx, 1);
                        } else {
                            this.blocks.push(definition);
                        }
                        this.collectDependencies(bootstrapped);
                    },
                    null,
                    () => contains(this.blocks, definition),
                    null,
                    null,
                    this.target ? block : block.fullImage()
                );
                checkBox.setPosition(new Point(
                    x,
                    y + (checkBox.top() - checkBox.toggleElement.top())
                ));
                palette.addContents(checkBox);
                y += checkBox.fullBounds().height() + padding;
            }
        });
    });

    palette.scrollX(padding);
    palette.scrollY(padding);
    this.addBody(palette);

    this.addButton('ok', 'OK');
    this.addButton('cancel', 'Cancel');

    this.setExtent(new Point(220, 300));
    this.fixLayout();
};

BlockExportDialogMorph.prototype.popUp = function (wrrld) {
    var world = wrrld || this.target.world();
    if (world) {
        BlockExportDialogMorph.uber.popUp.call(this, world);
        this.handle = new HandleMorph(
            this,
            200,
            220,
            this.corner,
            this.corner
        );
    }
};

// BlockExportDialogMorph menu

BlockExportDialogMorph.prototype.userMenu = function () {
    var menu = new MenuMorph(this, 'select'),
        on = new SymbolMorph(
            'checkedBox',
            MorphicPreferences.menuFontSize * 0.75
        );
    menu.addItem('all', 'selectAll');
    menu.addItem('none', 'selectNone');
    if (this.blocks.some(any => any.isBootstrapped()) &&
        this.blocks.some(any => !any.isBootstrapped())
    ) {
        menu.addItem(
            [
                on,
                localize('primitives')
            ],
            'noPrims'
        );
    }
    return menu;
};

BlockExportDialogMorph.prototype.selectAll = function () {
    this.body.contents.children.forEach(checkBox => {
        if (!checkBox.state) {
            checkBox.trigger();
        }
    });
};

BlockExportDialogMorph.prototype.selectNone = function () {
    this.blocks = [];
    this.body.contents.children.forEach(checkBox => {
        checkBox.refresh();
    });
};

BlockExportDialogMorph.prototype.noPrims = function () {
    this.blocks = this.blocks.filter(def => !def.isBootstrapped());
    this.body.contents.children.forEach(checkBox => {
        checkBox.refresh();
    });
};

// BlockExportDialogMorph dependency management

BlockExportDialogMorph.prototype.collectDependencies = function () {
    // add dependencies to the blocks:
    this.dependencies().forEach(def => {
        if (!contains(this.blocks, def)) {
            this.blocks.push(def);
        }
    });
    this.collectDataDependencies();
    // refresh the checkmarks
    this.body.contents.children.forEach(checkBox => {
        checkBox.refresh();
    });
};

BlockExportDialogMorph.prototype.dependencies = function () {
    var deps = [];
    this.blocks.forEach(def => def.collectDependencies(
        SpriteMorph.prototype.quasiPrimitives(),
        deps,
        def.receiver
    ));
    return deps;
};

// BlockExportDialogMorph ops

BlockExportDialogMorph.prototype.exportBlocks = function () {
    var ide = this.world().children[0];

    if (this.blocks.length) {
        ide.saveXMLAs(
            ide.blocksLibraryXML(
                this.blocks,
                null,
                true, // as file
                this.globalData.fork(this.globalVarNames),
                this.localData.fork(this.localVarNames)
            ),
            (ide.getProjectName() || localize('untitled')) +
                ' ' +
                localize('blocks'
            )
        );
    } else {
        new DialogBoxMorph().inform(
            'Export blocks',
            'no blocks were selected',
            this.world()
        );
    }
};

// BlockExportDialogMorph layout

BlockExportDialogMorph.prototype.fixLayout
    = BlockEditorMorph.prototype.fixLayout;

// BlockImportDialogMorph ////////////////////////////////////////////////////

// BlockImportDialogMorph inherits from DialogBoxMorph
// and pseudo-inherits from BlockExportDialogMorph:

BlockImportDialogMorph.prototype = new DialogBoxMorph();
BlockImportDialogMorph.prototype.constructor = BlockImportDialogMorph;
BlockImportDialogMorph.uber = DialogBoxMorph.prototype;

// BlockImportDialogMorph constants:

BlockImportDialogMorph.prototype.key = 'blockImport';

// BlockImportDialogMorph instance creation:

function BlockImportDialogMorph(blocks, target, name) {
    this.init(blocks, target, name);
}

BlockImportDialogMorph.prototype.init = function (blocks, target, name) {
    // additional properties:
    this.blocks = blocks.slice(0);
    this.handle = null;

    // initialize inherited properties:
    BlockExportDialogMorph.uber.init.call(
        this,
        target,
        () => this.importBlocks(name),
        null // environment
    );

    // override inherited properites:
    this.labelString = localize('Import blocks')
        + (name ? ': ' : '')
        + name || '';
    this.createLabel();

    // build contents
    this.buildContents();
};

BlockImportDialogMorph.prototype.buildContents
    = BlockExportDialogMorph.prototype.buildContents;

BlockImportDialogMorph.prototype.popUp
    = BlockExportDialogMorph.prototype.popUp;

// BlockImportDialogMorph menu

BlockImportDialogMorph.prototype.userMenu
    = BlockExportDialogMorph.prototype.userMenu;

BlockImportDialogMorph.prototype.selectAll
    = BlockExportDialogMorph.prototype.selectAll;

BlockImportDialogMorph.prototype.selectNone
    = BlockExportDialogMorph.prototype.selectNone;

// BlockImportDialogMorph ops

BlockImportDialogMorph.prototype.importBlocks = function (name) {
    var ide = this.target.parentThatIsA(IDE_Morph);
    if (!ide) {return; }
    if (this.blocks.length > 0) {
        this.blocks.forEach(def => {
            if (def.isGlobal) {
                def.receiver = ide.stage;
                ide.stage.globalBlocks.push(def);
                ide.stage.replaceDoubleDefinitionsFor(def);
            } else {
                def.receiver = ide.currentSprite;
                ide.currentSprite.customBlocks.push(def);
                ide.currentSprite.replaceDoubleDefinitionsFor(def);
            }
        });
        ide.flushPaletteCache();
        ide.categories.refreshEmpty();
        ide.refreshPalette();
        ide.showMessage(
            'Imported Blocks Module' + (name ? ': ' + name : '') + '.',
            2
        );
    } else {
        new DialogBoxMorph().inform(
            'Import blocks',
            'no blocks were selected',
            this.world()
        );
    }
};

// BlockImportDialogMorph layout

BlockImportDialogMorph.prototype.fixLayout
    = BlockEditorMorph.prototype.fixLayout;

// BlockRemovalDialogMorph ///////////////////////////////////////////////////

// BlockRemovalDialogMorph inherits from DialogBoxMorph
// and pseudo-inherits from BlockExportDialogMorph:

BlockRemovalDialogMorph.prototype = new DialogBoxMorph();
BlockRemovalDialogMorph.prototype.constructor = BlockImportDialogMorph;
BlockRemovalDialogMorph.uber = DialogBoxMorph.prototype;

// BlockRemovalDialogMorph constants:

BlockRemovalDialogMorph.prototype.key = 'blockRemove';

// BlockRemovalDialogMorph instance creation:

function BlockRemovalDialogMorph(blocks, target) {
    this.init(blocks, target);
}

BlockRemovalDialogMorph.prototype.init = function (blocks, target) {
    // additional properties:
    this.blocks = blocks.slice(0);
    this.handle = null;

    // initialize inherited properties:
    BlockExportDialogMorph.uber.init.call(
        this,
        target,
        () => this.removeBlocks(),
        null // environment
    );

    // override inherited properites:
    this.labelString = localize('Remove unused blocks')
        + (name ? ': ' : '')
        + name || '';
    this.createLabel();

    // build contents
    this.buildContents();
};

BlockRemovalDialogMorph.prototype.buildContents = function () {
    var palette, x, y, block, checkBox, lastCat,
        padding = 4,
        bootstrapped = SpriteMorph.prototype.bootstrappedBlocks();

    // create plaette
    palette = new ScrollFrameMorph(
        null,
        null,
        SpriteMorph.prototype.sliderColor
    );
    palette.color = SpriteMorph.prototype.paletteColor;
    palette.padding = padding;
    palette.isDraggable = false;
    palette.acceptsDrops = false;
    palette.contents.acceptsDrops = false;

    // populate palette
    x = palette.left() + padding;
    y = palette.top() + padding;

    // - create selectors for blocks
    SpriteMorph.prototype.allCategories().forEach(category => {
        this.blocks.forEach(definition => {
            if (definition.category === category) {
                if (lastCat && (category !== lastCat)) {
                    y += padding;
                }
                lastCat = category;
                block = definition.templateInstance();
                block.isToggleLabel = true; // mark as unrefreshable label
                checkBox = new ToggleMorph(
                    'checkbox',
                    this,
                    () => {
                        var idx = this.blocks.indexOf(definition);
                        if (idx > -1) {
                            this.blocks.splice(idx, 1);
                        } else {
                            this.blocks.push(definition);
                        }
                        this.collectDependencies(bootstrapped);
                    },
                    null,
                    () => contains(this.blocks, definition),
                    null,
                    null,
                    this.target ? block : block.fullImage()
                );
                checkBox.setPosition(new Point(
                    x,
                    y + (checkBox.top() - checkBox.toggleElement.top())
                ));
                palette.addContents(checkBox);
                y += checkBox.fullBounds().height() + padding;
            }
        });
    });

    palette.scrollX(padding);
    palette.scrollY(padding);
    this.addBody(palette);

    this.addButton('ok', 'OK');
    this.addButton('cancel', 'Cancel');

    this.setExtent(new Point(220, 300));
    this.fixLayout();
};

BlockRemovalDialogMorph.prototype.popUp
    = BlockExportDialogMorph.prototype.popUp;

// BlockRemovalDialogMorph menu

BlockRemovalDialogMorph.prototype.userMenu
    = BlockExportDialogMorph.prototype.userMenu;

BlockRemovalDialogMorph.prototype.selectAll
    = BlockExportDialogMorph.prototype.selectAll;

BlockRemovalDialogMorph.prototype.selectNone
    = BlockExportDialogMorph.prototype.selectNone;

// BlockRemovelDialogMorph dependency management

BlockRemovalDialogMorph.prototype.collectDependencies = function () {
    // add dependencies to the blocks:
    this.dependencies().forEach(def => {
        if (!contains(this.blocks, def)) {
            this.blocks.push(def);
        }
    });
    // refresh the checkmarks
    this.body.contents.children.forEach(checkBox => {
        checkBox.refresh();
    });
};

BlockRemovalDialogMorph.prototype.dependencies =
    BlockExportDialogMorph.prototype.dependencies;

// BlockRemovalDialogMorph ops

BlockRemovalDialogMorph.prototype.removeBlocks = function () {
    var ide = this.target;
    if (!ide) {return; }
    if (this.blocks.length > 0) {
        this.blocks.forEach(def => {
            var idx = ide.stage.globalBlocks.indexOf(def);
            if (idx !== -1) {
                ide.stage.globalBlocks.splice(idx, 1);
            }
        });
        ide.flushPaletteCache();
        ide.categories.refreshEmpty();
        ide.refreshPalette();
        ide.showMessage(
            this.blocks.length + ' ' + localize('unused block(s) removed'),
            2
        );
    } else {
        new DialogBoxMorph().inform(
            'Remove unused blocks',
            'no blocks were selected',
            this.world()
        );
    }
};

// BlockRemovalDialogMorph layout

BlockRemovalDialogMorph.prototype.fixLayout
    = BlockEditorMorph.prototype.fixLayout;

// BlockVisibilityDialogMorph //////////////////////////////////////////////////

// BlockVisibilityDialogMorph inherits from DialogBoxMorph
// and pseudo-inherits from BlockExportDialogMorph:

BlockVisibilityDialogMorph.prototype = new DialogBoxMorph();
BlockVisibilityDialogMorph.prototype.constructor = BlockVisibilityDialogMorph;
BlockVisibilityDialogMorph.uber = DialogBoxMorph.prototype;

// BlockVisibilityDialogMorph constants:

BlockVisibilityDialogMorph.prototype.key = 'blockVisibility';

// BlockVisibilityDialogMorph instance creation:

function BlockVisibilityDialogMorph(target) {
    this.init(target);
}

BlockVisibilityDialogMorph.prototype.init = function (target) {
    // additional properties:
    this.blocks = target.allPaletteBlocks();
    this.selection = this.blocks.filter(each => target.isHidingBlock(each));
    this.handle = null;

    // initialize inherited properties:
    BlockVisibilityDialogMorph.uber.init.call(
        this,
        target,
        () => this.hideBlocks(),
        null // environment
    );

    // override inherited properites:
    this.labelString = localize('Hide blocks in palette')
        + (name ? ': ' : '')
        + name || '';
    this.createLabel();

    // build contents
    this.buildContents();
};

BlockVisibilityDialogMorph.prototype.buildContents = function () {
    var palette, x, y, checkBox, lastCat,
        padding = 4;

    // create plaette
    palette = new ScrollFrameMorph(
        null,
        null,
        SpriteMorph.prototype.sliderColor
    );
    palette.color = SpriteMorph.prototype.paletteColor;
    palette.padding = padding;
    palette.isDraggable = false;
    palette.acceptsDrops = false;
    palette.contents.acceptsDrops = false;

    // populate palette
    x = palette.left() + padding;
    y = palette.top() + padding;

    this.blocks.forEach(block => {
        if (lastCat && (block.category !== lastCat)) {
            y += padding;
        }
        lastCat = block.category;

        block.isToggleLabel = true; // mark block as unrefreshable toggle label
        checkBox = new ToggleMorph(
            'checkbox',
            this,
            () => {
                var idx = this.selection.indexOf(block);
                if (idx > -1) {
                    this.selection.splice(idx, 1);
                } else {
                    this.selection.push(block);
                }
            },
            null,
            () => contains(this.selection, block),
            null,
            null,
            block // allow block to be dragged off from templates
        );
        checkBox.setPosition(new Point(
            x,
            y + (checkBox.top() - checkBox.toggleElement.top())
        ));
        palette.addContents(checkBox);
        y += checkBox.fullBounds().height() + padding;
    });

    palette.scrollX(padding);
    palette.scrollY(padding);
    this.addBody(palette);

    this.addButton('ok', 'OK');
    this.addButton('cancel', 'Cancel');

    this.setExtent(new Point(220, 300));
    this.fixLayout();
};

BlockVisibilityDialogMorph.prototype.popUp
    = BlockExportDialogMorph.prototype.popUp;

// BlockVisibilityDialogMorph menu

BlockVisibilityDialogMorph.prototype.userMenu = function () {
    var menu = new MenuMorph(this, 'select');
    menu.addItem('all', 'selectAll');
    menu.addItem('none', 'selectNone');
    menu.addLine();
    menu.addItem('unused', 'selectUnused');
    return menu;
};


BlockVisibilityDialogMorph.prototype.selectAll = function () {
    this.selection = this.blocks.slice(0);
    this.body.contents.children.forEach(checkBox => {
        checkBox.refresh();
    });
};

BlockVisibilityDialogMorph.prototype.selectNone = function () {
    this.selection = [];
    this.body.contents.children.forEach(checkBox => {
        checkBox.refresh();
    });
};

BlockVisibilityDialogMorph.prototype.selectUnused = function () {
    var used = this.target.scripts.allChildren().filter(
            m => m instanceof BlockMorph),
        uPrim = [],
        uCust = [],
        uVars = [];

    used.forEach(b => {
        if (b.isCustomBlock) {
            uCust.push(b.isGlobal ? b.definition
                : this.target.getMethod(b.semanticSpec));
        } else if (b.selector === 'reportGetVar') {
            uVars.push(b.blockSpec);
        } else {
            uPrim.push(b.selector);
        }
    });

    this.selection = this.blocks.filter(b => {
        if (b.isCustomBlock) {
            return !contains(
                uCust,
                b.isGlobal ? b.definition
                    : this.target.getMethod(b.semanticSpec)
                );
        } else if (b.selector === 'reportGetVar') {
            return !contains(uVars, b.blockSpec);
        } else {
            return !contains(uPrim, b.selector);
        }
    });

    this.body.contents.children.forEach(checkBox => {
        checkBox.refresh();
    });
};

// BlockVisibilityDialogMorph ops

BlockVisibilityDialogMorph.prototype.hideBlocks = function () {
    var ide = this.target.parentThatIsA(IDE_Morph);
    this.blocks.forEach(block => this.target.changeBlockVisibility(
        block,
        contains(this.selection, block),
        true // quick - without palette update
    ));
    if (this.selection.length === 0) {
        StageMorph.prototype.hiddenPrimitives = [];
    }
    ide.flushBlocksCache();
    ide.refreshPalette();
    ide.categories.refreshEmpty();
    this.target.recordUserEdit(
        'palette',
        'hide block'
    );
};

// BlockVisibilityDialogMorph layout

BlockVisibilityDialogMorph.prototype.fixLayout
    = BlockEditorMorph.prototype.fixLayout;
