var Hell = {
    RESPONSE_STATUS_SUCCESS: 'success',
    RESPONSE_STATUS_ERROR: 'error',
    RESPONSE_STATUS_INFO: 'info',
    RESPONSE_STATUS_EXCHANGE: 'exchange',
    DB_STATE_ACTIVE: 'active',
    DB_STATE_FINISHED: 'finished',
    DB_STATE_PENDING: 'pending',
    DB_STATE_CANCELLED: 'cancelled',
    SOCKETIO_PUSHER_GENERIC_MESSAGE: 'message',
    SOCKETIO_PUSHER_GENERIC_WITHDRAW_MONEY: 'withdraw_money',
    SOCKETIO_PUSHER_GENERIC_WITHDRAW_ITEM: 'withdraw_item',
    SOCKETIO_PUSHER_GENERIC_CASEBATTLE: 'casebattle',
    SOCKETIO_PUSHER_GENERIC_GIVEAWAY: 'giveaway',
    SOCKETIO_PUSHER_GENERIC_SUPPORT: 'support',
    STEAM_TRADE_OFFER_STATE_NONE: 0,
    STEAM_TRADE_OFFER_STATE_INVALID_OR_QUEUED: 1,
    STEAM_TRADE_OFFER_STATE_ACTIVE: 2,
    STEAM_TRADE_OFFER_STATE_ACCEPTED: 3,
    STEAM_TRADE_OFFER_STATE_COUNTERED: 4,
    STEAM_TRADE_OFFER_STATE_EXPIRED: 5,
    STEAM_TRADE_OFFER_STATE_CANCELED: 6,
    STEAM_TRADE_OFFER_STATE_DECLINED: 7,
    STEAM_TRADE_OFFER_STATE_INVALIDITEMS: 8,
    STEAM_TRADE_OFFER_STATE_PENDING_CONFIRMATION: 9,
    STEAM_TRADE_OFFER_STATE_SECONDFACTOR_CANCELED: 10,
    STEAM_TRADE_OFFER_STATE_SOLD: 15,
    STEAM_TRADE_OFFER_STATE_CONTRACT: 16,
    STEAM_TRADE_OFFER_STATE_UPGRADE: 17,
    STEAM_TRADE_OFFER_STATE_EXCHANGE: 18,
    STEAM_TRADE_OFFER_STATE_CASHOUT: 19,
    STEAM_TRADE_OFFER_STATE_ADMIN_BAN: 20,
    DROP_TYPE_ALL: 'all',
    DROP_TYPE_BEST: 'lucky',
    DROP_TYPE_TOP24: 'top24',
    SOUND_NOTICE_ALL: config.HTTPS_CDN_DOMAIN + '/hellcase/snd/chin-up.mp3',
    SOUND_NOTICE_ITEM: config.HTTPS_CDN_DOMAIN + '/hellcase/snd/definite.mp3',
    OPEN_TYPES: {
        CASE: 'case',
        ITEM: 'item',
        BATTLE: 'battle',
        CONTRACT: 'contract',
        SHARD: 'shard',
        FREE: 'free',
        UPGRADE: 'upgrade',
        FARM: 'farm',
        GIVEAWAY: 'giveaway',
        EXCHANGE: 'exchange',
        MULTICASE: 'multicase',
        WHEEL: 'wheel',
        BUY: 'buy',
        EVENT_SHOP: 'event_shop',
    }
};
(function ($) {
    if ($.fn.style) {
        return;
    }
    var escape = function (text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };
    var isStyleFuncSupported = !!CSSStyleDeclaration.prototype.getPropertyValue;
    if (!isStyleFuncSupported) {
        CSSStyleDeclaration.prototype.getPropertyValue = function (a) {
            return this.getAttribute(a);
        };
        CSSStyleDeclaration.prototype.setProperty = function (styleName, value, priority) {
            this.setAttribute(styleName, value);
            var priority = typeof priority != 'undefined' ? priority : '';
            if (priority != '') {
                var rule = new RegExp(escape(styleName) + '\\s*:\\s*' + escape(value) +
                    '(\\s*;)?', 'gmi');
                this.cssText = this.cssText.replace(rule, styleName + ': ' + value + ' !' + priority + ';');
            }
        };
        CSSStyleDeclaration.prototype.removeProperty = function (a) {
            return this.removeAttribute(a);
        };
        CSSStyleDeclaration.prototype.getPropertyPriority = function (styleName) {
            var rule = new RegExp(escape(styleName) + '\\s*:\\s*[^\\s]*\\s*!important(\\s*;)?', 'gmi');
            return rule.test(this.cssText) ? 'important' : '';
        }
    }
    $.fn.style = function (styleName, value, priority) {
        var node = this.get(0);
        if (typeof node == 'undefined') {
            return this;
        }
        var style = this.get(0).style;
        if (typeof styleName != 'undefined') {
            if (typeof value != 'undefined') {
                priority = typeof priority != 'undefined' ? priority : '';
                style.setProperty(styleName, value, priority);
                return this;
            } else {
                return style.getPropertyValue(styleName);
            }
        } else {
            return style;
        }
    };
})(jQuery);
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('sifter', factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Sifter = factory();
    }
}(this, function () {
    var Sifter = function (items, settings) {
        this.items = items;
        this.settings = settings || {
            diacritics: true
        };
    };
    Sifter.prototype.tokenize = function (query) {
        query = trim(String(query || '').toLowerCase());
        if (!query || !query.length) return [];
        var i, n, regex, letter;
        var tokens = [];
        var words = query.split(/ +/);
        for (i = 0, n = words.length; i < n; i++) {
            regex = escape_regex(words[i]);
            if (this.settings.diacritics) {
                for (letter in DIACRITICS) {
                    if (DIACRITICS.hasOwnProperty(letter)) {
                        regex = regex.replace(new RegExp(letter, 'g'), DIACRITICS[letter]);
                    }
                }
            }
            tokens.push({
                string: words[i],
                regex: new RegExp(regex, 'i')
            });
        }
        return tokens;
    };
    Sifter.prototype.iterator = function (object, callback) {
        var iterator;
        if (is_array(object)) {
            iterator = Array.prototype.forEach || function (callback) {
                for (var i = 0, n = this.length; i < n; i++) {
                    callback(this[i], i, this);
                }
            };
        } else {
            iterator = function (callback) {
                for (var key in this) {
                    if (this.hasOwnProperty(key)) {
                        callback(this[key], key, this);
                    }
                }
            };
        }
        iterator.apply(object, [callback]);
    };
    Sifter.prototype.getScoreFunction = function (search, options) {
        var self, fields, tokens, token_count, nesting;
        self = this;
        search = self.prepareSearch(search, options);
        tokens = search.tokens;
        fields = search.options.fields;
        token_count = tokens.length;
        nesting = search.options.nesting;
        var scoreValue = function (value, token) {
            var score, pos;
            if (!value) return 0;
            value = String(value || '');
            pos = value.search(token.regex);
            if (pos === -1) return 0;
            score = token.string.length / value.length;
            if (pos === 0) score += 0.5;
            return score;
        };
        var scoreObject = (function () {
            var field_count = fields.length;
            if (!field_count) {
                return function () {
                    return 0;
                };
            }
            if (field_count === 1) {
                return function (token, data) {
                    return scoreValue(getattr(data, fields[0], nesting), token);
                };
            }
            return function (token, data) {
                for (var i = 0, sum = 0; i < field_count; i++) {
                    sum += scoreValue(getattr(data, fields[i], nesting), token);
                }
                return sum / field_count;
            };
        })();
        if (!token_count) {
            return function () {
                return 0;
            };
        }
        if (token_count === 1) {
            return function (data) {
                return scoreObject(tokens[0], data);
            };
        }
        if (search.options.conjunction === 'and') {
            return function (data) {
                var score;
                for (var i = 0, sum = 0; i < token_count; i++) {
                    score = scoreObject(tokens[i], data);
                    if (score <= 0) return 0;
                    sum += score;
                }
                return sum / token_count;
            };
        } else {
            return function (data) {
                for (var i = 0, sum = 0; i < token_count; i++) {
                    sum += scoreObject(tokens[i], data);
                }
                return sum / token_count;
            };
        }
    };
    Sifter.prototype.getSortFunction = function (search, options) {
        var i, n, self, field, fields, fields_count, multiplier, multipliers, get_field, implicit_score, sort;
        self = this;
        search = self.prepareSearch(search, options);
        sort = (!search.query && options.sort_empty) || options.sort;
        get_field = function (name, result) {
            if (name === '$score') return result.score;
            return getattr(self.items[result.id], name, options.nesting);
        };
        fields = [];
        if (sort) {
            for (i = 0, n = sort.length; i < n; i++) {
                if (search.query || sort[i].field !== '$score') {
                    fields.push(sort[i]);
                }
            }
        }
        if (search.query) {
            implicit_score = true;
            for (i = 0, n = fields.length; i < n; i++) {
                if (fields[i].field === '$score') {
                    implicit_score = false;
                    break;
                }
            }
            if (implicit_score) {
                fields.unshift({
                    field: '$score',
                    direction: 'desc'
                });
            }
        } else {
            for (i = 0, n = fields.length; i < n; i++) {
                if (fields[i].field === '$score') {
                    fields.splice(i, 1);
                    break;
                }
            }
        }
        multipliers = [];
        for (i = 0, n = fields.length; i < n; i++) {
            multipliers.push(fields[i].direction === 'desc' ? -1 : 1);
        }
        fields_count = fields.length;
        if (!fields_count) {
            return null;
        } else if (fields_count === 1) {
            field = fields[0].field;
            multiplier = multipliers[0];
            return function (a, b) {
                return multiplier * cmp(get_field(field, a), get_field(field, b));
            };
        } else {
            return function (a, b) {
                var i, result, a_value, b_value, field;
                for (i = 0; i < fields_count; i++) {
                    field = fields[i].field;
                    result = multipliers[i] * cmp(get_field(field, a), get_field(field, b));
                    if (result) return result;
                }
                return 0;
            };
        }
    };
    Sifter.prototype.prepareSearch = function (query, options) {
        if (typeof query === 'object') return query;
        options = extend({}, options);
        var option_fields = options.fields;
        var option_sort = options.sort;
        var option_sort_empty = options.sort_empty;
        if (option_fields && !is_array(option_fields)) options.fields = [option_fields];
        if (option_sort && !is_array(option_sort)) options.sort = [option_sort];
        if (option_sort_empty && !is_array(option_sort_empty)) options.sort_empty = [option_sort_empty];
        return {
            options: options,
            query: String(query || '').toLowerCase(),
            tokens: this.tokenize(query),
            total: 0,
            items: []
        };
    };
    Sifter.prototype.search = function (query, options) {
        var self = this,
            value, score, search, calculateScore;
        var fn_sort;
        var fn_score;
        search = this.prepareSearch(query, options);
        options = search.options;
        query = search.query;
        fn_score = options.score || self.getScoreFunction(search);
        if (query.length) {
            self.iterator(self.items, function (item, id) {
                score = fn_score(item);
                if (options.filter === false || score > 0) {
                    search.items.push({
                        'score': score,
                        'id': id
                    });
                }
            });
        } else {
            self.iterator(self.items, function (item, id) {
                search.items.push({
                    'score': 1,
                    'id': id
                });
            });
        }
        fn_sort = self.getSortFunction(search, options);
        if (fn_sort) search.items.sort(fn_sort);
        search.total = search.items.length;
        if (typeof options.limit === 'number') {
            search.items = search.items.slice(0, options.limit);
        }
        return search;
    };
    var cmp = function (a, b) {
        if (typeof a === 'number' && typeof b === 'number') {
            return a > b ? 1 : (a < b ? -1 : 0);
        }
        a = asciifold(String(a || ''));
        b = asciifold(String(b || ''));
        if (a > b) return 1;
        if (b > a) return -1;
        return 0;
    };
    var extend = function (a, b) {
        var i, n, k, object;
        for (i = 1, n = arguments.length; i < n; i++) {
            object = arguments[i];
            if (!object) continue;
            for (k in object) {
                if (object.hasOwnProperty(k)) {
                    a[k] = object[k];
                }
            }
        }
        return a;
    };
    var getattr = function (obj, name, nesting) {
        if (!obj || !name) return;
        if (!nesting) return obj[name];
        var names = name.split(".");
        while (names.length && (obj = obj[names.shift()]));
        return obj;
    };
    var trim = function (str) {
        return (str + '').replace(/^\s+|\s+$|/g, '');
    };
    var escape_regex = function (str) {
        return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    };
    var is_array = Array.isArray || (typeof $ !== 'undefined' && $.isArray) || function (object) {
        return Object.prototype.toString.call(object) === '[object Array]';
    };
    var DIACRITICS = {
        'a': '[aḀḁĂăÂâǍǎȺⱥȦȧẠạÄäÀàÁáĀāÃãÅåąĄÃąĄ]',
        'b': '[b␢βΒB฿𐌁ᛒ]',
        'c': '[cĆćĈĉČčĊċC̄c̄ÇçḈḉȻȼƇƈɕᴄＣｃ]',
        'd': '[dĎďḊḋḐḑḌḍḒḓḎḏĐđD̦d̦ƉɖƊɗƋƌᵭᶁᶑȡᴅＤｄð]',
        'e': '[eÉéÈèÊêḘḙĚěĔĕẼẽḚḛẺẻĖėËëĒēȨȩĘęᶒɆɇȄȅẾếỀềỄễỂểḜḝḖḗḔḕȆȇẸẹỆệⱸᴇＥｅɘǝƏƐε]',
        'f': '[fƑƒḞḟ]',
        'g': '[gɢ₲ǤǥĜĝĞğĢģƓɠĠġ]',
        'h': '[hĤĥĦħḨḩẖẖḤḥḢḣɦʰǶƕ]',
        'i': '[iÍíÌìĬĭÎîǏǐÏïḮḯĨĩĮįĪīỈỉȈȉȊȋỊịḬḭƗɨɨ̆ᵻᶖİiIıɪＩｉ]',
        'j': '[jȷĴĵɈɉʝɟʲ]',
        'k': '[kƘƙꝀꝁḰḱǨǩḲḳḴḵκϰ₭]',
        'l': '[lŁłĽľĻļĹĺḶḷḸḹḼḽḺḻĿŀȽƚⱠⱡⱢɫɬᶅɭȴʟＬｌ]',
        'n': '[nŃńǸǹŇňÑñṄṅŅņṆṇṊṋṈṉN̈n̈ƝɲȠƞᵰᶇɳȵɴＮｎŊŋ]',
        'o': '[oØøÖöÓóÒòÔôǑǒŐőŎŏȮȯỌọƟɵƠơỎỏŌōÕõǪǫȌȍՕօ]',
        'p': '[pṔṕṖṗⱣᵽƤƥᵱ]',
        'q': '[qꝖꝗʠɊɋꝘꝙq̃]',
        'r': '[rŔŕɌɍŘřŖŗṘṙȐȑȒȓṚṛⱤɽ]',
        's': '[sŚśṠṡṢṣꞨꞩŜŝŠšŞşȘșS̈s̈]',
        't': '[tŤťṪṫŢţṬṭƮʈȚțṰṱṮṯƬƭ]',
        'u': '[uŬŭɄʉỤụÜüÚúÙùÛûǓǔŰűŬŭƯưỦủŪūŨũŲųȔȕ∪]',
        'v': '[vṼṽṾṿƲʋꝞꝟⱱʋ]',
        'w': '[wẂẃẀẁŴŵẄẅẆẇẈẉ]',
        'x': '[xẌẍẊẋχ]',
        'y': '[yÝýỲỳŶŷŸÿỸỹẎẏỴỵɎɏƳƴ]',
        'z': '[zŹźẐẑŽžŻżẒẓẔẕƵƶ]'
    };
    var asciifold = (function () {
        var i, n, k, chunk;
        var foreignletters = '';
        var lookup = {};
        for (k in DIACRITICS) {
            if (DIACRITICS.hasOwnProperty(k)) {
                chunk = DIACRITICS[k].substring(2, DIACRITICS[k].length - 1);
                foreignletters += chunk;
                for (i = 0, n = chunk.length; i < n; i++) {
                    lookup[chunk.charAt(i)] = k;
                }
            }
        }
        var regexp = new RegExp('[' + foreignletters + ']', 'g');
        return function (str) {
            return str.replace(regexp, function (foreignletter) {
                return lookup[foreignletter];
            }).toLowerCase();
        };
    })();
    return Sifter;
}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('microplugin', factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.MicroPlugin = factory();
    }
}(this, function () {
    var MicroPlugin = {};
    MicroPlugin.mixin = function (Interface) {
        Interface.plugins = {};
        Interface.prototype.initializePlugins = function (plugins) {
            var i, n, key;
            var self = this;
            var queue = [];
            self.plugins = {
                names: [],
                settings: {},
                requested: {},
                loaded: {}
            };
            if (utils.isArray(plugins)) {
                for (i = 0, n = plugins.length; i < n; i++) {
                    if (typeof plugins[i] === 'string') {
                        queue.push(plugins[i]);
                    } else {
                        self.plugins.settings[plugins[i].name] = plugins[i].options;
                        queue.push(plugins[i].name);
                    }
                }
            } else if (plugins) {
                for (key in plugins) {
                    if (plugins.hasOwnProperty(key)) {
                        self.plugins.settings[key] = plugins[key];
                        queue.push(key);
                    }
                }
            }
            while (queue.length) {
                self.require(queue.shift());
            }
        };
        Interface.prototype.loadPlugin = function (name) {
            var self = this;
            var plugins = self.plugins;
            var plugin = Interface.plugins[name];
            if (!Interface.plugins.hasOwnProperty(name)) {
                throw new Error('Unable to find "' + name + '" plugin');
            }
            plugins.requested[name] = true;
            plugins.loaded[name] = plugin.fn.apply(self, [self.plugins.settings[name] || {}]);
            plugins.names.push(name);
        };
        Interface.prototype.require = function (name) {
            var self = this;
            var plugins = self.plugins;
            if (!self.plugins.loaded.hasOwnProperty(name)) {
                if (plugins.requested[name]) {
                    throw new Error('Plugin has circular dependency ("' + name + '")');
                }
                self.loadPlugin(name);
            }
            return plugins.loaded[name];
        };
        Interface.define = function (name, fn) {
            Interface.plugins[name] = {
                'name': name,
                'fn': fn
            };
        };
    };
    var utils = {
        isArray: Array.isArray || function (vArg) {
            return Object.prototype.toString.call(vArg) === '[object Array]';
        }
    };
    return MicroPlugin;
}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('selectize', ['jquery', 'sifter', 'microplugin'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('jquery'), require('sifter'), require('microplugin'));
    } else {
        root.Selectize = factory(root.jQuery, root.Sifter, root.MicroPlugin);
    }
}(this, function ($, Sifter, MicroPlugin) {
    'use strict';
    var highlight = function ($element, pattern) {
        if (typeof pattern === 'string' && !pattern.length) return;
        var regex = (typeof pattern === 'string') ? new RegExp(pattern, 'i') : pattern;
        var highlight = function (node) {
            var skip = 0;
            if (node.nodeType === 3) {
                var pos = node.data.search(regex);
                if (pos >= 0 && node.data.length > 0) {
                    var match = node.data.match(regex);
                    var spannode = document.createElement('span');
                    spannode.className = 'highlight';
                    var middlebit = node.splitText(pos);
                    var endbit = middlebit.splitText(match[0].length);
                    var middleclone = middlebit.cloneNode(true);
                    spannode.appendChild(middleclone);
                    middlebit.parentNode.replaceChild(spannode, middlebit);
                    skip = 1;
                }
            } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
                for (var i = 0; i < node.childNodes.length; ++i) {
                    i += highlight(node.childNodes[i]);
                }
            }
            return skip;
        };
        return $element.each(function () {
            highlight(this);
        });
    };
    $.fn.removeHighlight = function () {
        return this.find("span.highlight").each(function () {
            this.parentNode.firstChild.nodeName;
            var parent = this.parentNode;
            parent.replaceChild(this.firstChild, this);
            parent.normalize();
        }).end();
    };
    var MicroEvent = function () {};
    MicroEvent.prototype = {
        on: function (event, fct) {
            this._events = this._events || {};
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        },
        off: function (event, fct) {
            var n = arguments.length;
            if (n === 0) return delete this._events;
            if (n === 1) return delete this._events[event];
            this._events = this._events || {};
            if (event in this._events === false) return;
            this._events[event].splice(this._events[event].indexOf(fct), 1);
        },
        trigger: function (event) {
            this._events = this._events || {};
            if (event in this._events === false) return;
            for (var i = 0; i < this._events[event].length; i++) {
                this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }
    };
    MicroEvent.mixin = function (destObject) {
        var props = ['on', 'off', 'trigger'];
        for (var i = 0; i < props.length; i++) {
            destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
        }
    };
    var IS_MAC = /Mac/.test(navigator.userAgent);
    var KEY_A = 65;
    var KEY_COMMA = 188;
    var KEY_RETURN = 13;
    var KEY_ESC = 27;
    var KEY_LEFT = 37;
    var KEY_UP = 38;
    var KEY_P = 80;
    var KEY_RIGHT = 39;
    var KEY_DOWN = 40;
    var KEY_N = 78;
    var KEY_BACKSPACE = 8;
    var KEY_DELETE = 46;
    var KEY_SHIFT = 16;
    var KEY_CMD = IS_MAC ? 91 : 17;
    var KEY_CTRL = IS_MAC ? 18 : 17;
    var KEY_TAB = 9;
    var TAG_SELECT = 1;
    var TAG_INPUT = 2;
    var SUPPORTS_VALIDITY_API = !/android/i.test(window.navigator.userAgent) && !!document.createElement('input').validity;
    var isset = function (object) {
        return typeof object !== 'undefined';
    };
    var hash_key = function (value) {
        if (typeof value === 'undefined' || value === null) return null;
        if (typeof value === 'boolean') return value ? '1' : '0';
        return value + '';
    };
    var escape_html = function (str) {
        return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };
    var escape_replace = function (str) {
        return (str + '').replace(/\$/g, '$$$$');
    };
    var hook = {};
    hook.before = function (self, method, fn) {
        var original = self[method];
        self[method] = function () {
            fn.apply(self, arguments);
            return original.apply(self, arguments);
        };
    };
    hook.after = function (self, method, fn) {
        var original = self[method];
        self[method] = function () {
            var result = original.apply(self, arguments);
            fn.apply(self, arguments);
            return result;
        };
    };
    var once = function (fn) {
        var called = false;
        return function () {
            if (called) return;
            called = true;
            fn.apply(this, arguments);
        };
    };
    var debounce = function (fn, delay) {
        var timeout;
        return function () {
            var self = this;
            var args = arguments;
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                fn.apply(self, args);
            }, delay);
        };
    };
    var debounce_events = function (self, types, fn) {
        var type;
        var trigger = self.trigger;
        var event_args = {};
        self.trigger = function () {
            var type = arguments[0];
            if (types.indexOf(type) !== -1) {
                event_args[type] = arguments;
            } else {
                return trigger.apply(self, arguments);
            }
        };
        fn.apply(self, []);
        self.trigger = trigger;
        for (type in event_args) {
            if (event_args.hasOwnProperty(type)) {
                trigger.apply(self, event_args[type]);
            }
        }
    };
    var watchChildEvent = function ($parent, event, selector, fn) {
        $parent.on(event, selector, function (e) {
            var child = e.target;
            while (child && child.parentNode !== $parent[0]) {
                child = child.parentNode;
            }
            e.currentTarget = child;
            return fn.apply(this, [e]);
        });
    };
    var getSelection = function (input) {
        var result = {};
        if ('selectionStart' in input) {
            result.start = input.selectionStart;
            result.length = input.selectionEnd - result.start;
        } else if (document.selection) {
            input.focus();
            var sel = document.selection.createRange();
            var selLen = document.selection.createRange().text.length;
            sel.moveStart('character', -input.value.length);
            result.start = sel.text.length - selLen;
            result.length = selLen;
        }
        return result;
    };
    var transferStyles = function ($from, $to, properties) {
        var i, n, styles = {};
        if (properties) {
            for (i = 0, n = properties.length; i < n; i++) {
                styles[properties[i]] = $from.css(properties[i]);
            }
        } else {
            styles = $from.css();
        }
        $to.css(styles);
    };
    var measureString = function (str, $parent) {
        if (!str) {
            return 0;
        }
        var $test = $('<test>').css({
            position: 'absolute',
            top: -99999,
            left: -99999,
            width: 'auto',
            padding: 0,
            whiteSpace: 'pre'
        }).text(str).appendTo('body');
        transferStyles($parent, $test, ['letterSpacing', 'fontSize', 'fontFamily', 'fontWeight', 'textTransform']);
        var width = $test.width();
        $test.remove();
        return width;
    };
    var autoGrow = function ($input) {
        var currentWidth = null;
        var update = function (e, options) {
            var value, keyCode, printable, placeholder, width;
            var shift, character, selection;
            e = e || window.event || {};
            options = options || {};
            if (e.metaKey || e.altKey) return;
            if (!options.force && $input.data('grow') === false) return;
            value = $input.val();
            if (e.type && e.type.toLowerCase() === 'keydown') {
                keyCode = e.keyCode;
                printable = ((keyCode >= 97 && keyCode <= 122) || (keyCode >= 65 && keyCode <= 90) || (keyCode >= 48 && keyCode <= 57) || keyCode === 32);
                if (keyCode === KEY_DELETE || keyCode === KEY_BACKSPACE) {
                    selection = getSelection($input[0]);
                    if (selection.length) {
                        value = value.substring(0, selection.start) + value.substring(selection.start + selection.length);
                    } else if (keyCode === KEY_BACKSPACE && selection.start) {
                        value = value.substring(0, selection.start - 1) + value.substring(selection.start + 1);
                    } else if (keyCode === KEY_DELETE && typeof selection.start !== 'undefined') {
                        value = value.substring(0, selection.start) + value.substring(selection.start + 1);
                    }
                } else if (printable) {
                    shift = e.shiftKey;
                    character = String.fromCharCode(e.keyCode);
                    if (shift) character = character.toUpperCase();
                    else character = character.toLowerCase();
                    value += character;
                }
            }
            placeholder = $input.attr('placeholder');
            if (!value && placeholder) {
                value = placeholder;
            }
            width = measureString(value, $input) + 4;
            if (width !== currentWidth) {
                currentWidth = width;
                $input.style('width', 500 + 'px', 'important');
                $input.triggerHandler('resize');
            }
        };
        $input.on('keydown keyup update blur', update);
        update();
    };
    var domToString = function (d) {
        var tmp = document.createElement('div');
        tmp.appendChild(d.cloneNode(true));
        return tmp.innerHTML;
    };
    var logError = function (message, options) {
        if (!options) options = {};
        var component = "Selectize";
        console.error(component + ": " + message)
        if (options.explanation) {
            if (console.group) console.group();
            console.error(options.explanation);
            if (console.group) console.groupEnd();
        }
    }
    var Selectize = function ($input, settings) {
        var key, i, n, dir, input, self = this;
        input = $input[0];
        input.selectize = self;
        var computedStyle = window.getComputedStyle && window.getComputedStyle(input, null);
        dir = computedStyle ? computedStyle.getPropertyValue('direction') : input.currentStyle && input.currentStyle.direction;
        dir = dir || $input.parents('[dir]:first').attr('dir') || '';
        $.extend(self, {
            order: 0,
            settings: settings,
            $input: $input,
            tabIndex: $input.attr('tabindex') || '',
            tagType: input.tagName.toLowerCase() === 'select' ? TAG_SELECT : TAG_INPUT,
            rtl: /rtl/i.test(dir),
            eventNS: '.selectize' + (++Selectize.count),
            highlightedValue: null,
            isOpen: false,
            isDisabled: false,
            isRequired: $input.is('[required]'),
            isInvalid: false,
            isLocked: false,
            isFocused: false,
            isInputHidden: false,
            isSetup: false,
            isShiftDown: false,
            isCmdDown: false,
            isCtrlDown: false,
            ignoreFocus: false,
            ignoreBlur: false,
            ignoreHover: false,
            hasOptions: false,
            currentResults: null,
            lastValue: '',
            caretPos: 0,
            loading: 0,
            loadedSearches: {},
            $activeOption: null,
            $activeItems: [],
            optgroups: {},
            options: {},
            userOptions: {},
            items: [],
            renderCache: {},
            onSearchChange: settings.loadThrottle === null ? self.onSearchChange : debounce(self.onSearchChange, settings.loadThrottle)
        });
        self.sifter = new Sifter(this.options, {
            diacritics: settings.diacritics
        });
        if (self.settings.options) {
            for (i = 0, n = self.settings.options.length; i < n; i++) {
                self.registerOption(self.settings.options[i]);
            }
            delete self.settings.options;
        }
        if (self.settings.optgroups) {
            for (i = 0, n = self.settings.optgroups.length; i < n; i++) {
                self.registerOptionGroup(self.settings.optgroups[i]);
            }
            delete self.settings.optgroups;
        }
        self.settings.mode = self.settings.mode || (self.settings.maxItems === 1 ? 'single' : 'multi');
        if (typeof self.settings.hideSelected !== 'boolean') {
            self.settings.hideSelected = self.settings.mode === 'multi';
        }
        self.initializePlugins(self.settings.plugins);
        self.setupCallbacks();
        self.setupTemplates();
        self.setup();
    };
    MicroEvent.mixin(Selectize);
    if (typeof MicroPlugin !== "undefined") {
        MicroPlugin.mixin(Selectize);
    } else {
        logError("Dependency MicroPlugin is missing", {
            explanation: "Make sure you either: (1) are using the \"standalone\" " +
                "version of Selectize, or (2) require MicroPlugin before you " +
                "load Selectize."
        });
    }
    $.extend(Selectize.prototype, {
        setup: function () {
            var self = this;
            var settings = self.settings;
            var eventNS = self.eventNS;
            var $window = $(window);
            var $document = $(document);
            var $input = self.$input;
            var $wrapper;
            var $control;
            var $control_input;
            var $dropdown;
            var $dropdown_content;
            var $dropdown_parent;
            var inputMode;
            var timeout_blur;
            var timeout_focus;
            var classes;
            var classes_plugins;
            var inputId;
            inputMode = self.settings.mode;
            classes = $input.attr('class') || '';
            $wrapper = $('<div>').addClass(settings.wrapperClass).addClass(classes).addClass(inputMode);
            $control = $('<div>').addClass(settings.inputClass).addClass('items').appendTo($wrapper);
            $control_input = $('<input type="text" class="selectize-input-text" autocomplete="off" />').appendTo($control).attr('tabindex', $input.is(':disabled') ? '-1' : self.tabIndex);
            $dropdown_parent = $(settings.dropdownParent || $wrapper);
            $dropdown = $('<div>').addClass(settings.dropdownClass).addClass(inputMode).hide().appendTo($dropdown_parent);
            $dropdown_content = $('<div>').addClass(settings.dropdownContentClass).appendTo($dropdown);
            if (inputId = $input.attr('id')) {
                $control_input.attr('id', inputId + '-selectized');
                $("label[for='" + inputId + "']").attr('for', inputId + '-selectized');
            }
            if (self.settings.copyClassesToDropdown) {
                $dropdown.addClass(classes);
            }
            $wrapper.css({
                width: $input[0].style.width
            });
            if (self.plugins.names.length) {
                classes_plugins = 'plugin-' + self.plugins.names.join(' plugin-');
                $wrapper.addClass(classes_plugins);
                $dropdown.addClass(classes_plugins);
            }
            if ((settings.maxItems === null || settings.maxItems > 1) && self.tagType === TAG_SELECT) {
                $input.attr('multiple', 'multiple');
            }
            if (self.settings.placeholder) {
                $control_input.attr('placeholder', settings.placeholder);
            }
            if (!self.settings.splitOn && self.settings.delimiter) {
                var delimiterEscaped = self.settings.delimiter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                self.settings.splitOn = new RegExp('\\s*' + delimiterEscaped + '+\\s*');
            }
            if ($input.attr('autocorrect')) {
                $control_input.attr('autocorrect', $input.attr('autocorrect'));
            }
            if ($input.attr('autocapitalize')) {
                $control_input.attr('autocapitalize', $input.attr('autocapitalize'));
            }
            self.$wrapper = $wrapper;
            self.$control = $control;
            self.$control_input = $control_input;
            self.$dropdown = $dropdown;
            self.$dropdown_content = $dropdown_content;
            $dropdown.on('mouseenter', '[data-selectable]', function () {
                return self.onOptionHover.apply(self, arguments);
            });
            $dropdown.on('mousedown click', '[data-selectable]', function () {
                return self.onOptionSelect.apply(self, arguments);
            });
            watchChildEvent($control, 'mousedown', '*:not(input)', function () {
                return self.onItemSelect.apply(self, arguments);
            });
            autoGrow($control_input);
            $control.on({
                mousedown: function () {
                    return self.onMouseDown.apply(self, arguments);
                },
                click: function () {
                    return self.onClick.apply(self, arguments);
                }
            });
            $control_input.on({
                mousedown: function (e) {
                    e.stopPropagation();
                },
                keydown: function () {
                    return self.onKeyDown.apply(self, arguments);
                },
                keyup: function () {
                    return self.onKeyUp.apply(self, arguments);
                },
                keypress: function () {
                    return self.onKeyPress.apply(self, arguments);
                },
                resize: function () {
                    self.positionDropdown.apply(self, []);
                },
                blur: function () {
                    return self.onBlur.apply(self, arguments);
                },
                focus: function () {
                    self.ignoreBlur = false;
                    return self.onFocus.apply(self, arguments);
                },
                paste: function () {
                    return self.onPaste.apply(self, arguments);
                }
            });
            $document.on('keydown' + eventNS, function (e) {
                self.isCmdDown = e[IS_MAC ? 'metaKey' : 'ctrlKey'];
                self.isCtrlDown = e[IS_MAC ? 'altKey' : 'ctrlKey'];
                self.isShiftDown = e.shiftKey;
            });
            $document.on('keyup' + eventNS, function (e) {
                if (e.keyCode === KEY_CTRL) self.isCtrlDown = false;
                if (e.keyCode === KEY_SHIFT) self.isShiftDown = false;
                if (e.keyCode === KEY_CMD) self.isCmdDown = false;
            });
            $document.on('mousedown' + eventNS, function (e) {
                if (self.isFocused) {
                    if (e.target === self.$dropdown[0] || e.target.parentNode === self.$dropdown[0]) {
                        return false;
                    }
                    if (!self.$control.has(e.target).length && e.target !== self.$control[0]) {
                        self.blur(e.target);
                    }
                }
            });
            $window.on(['scroll' + eventNS, 'resize' + eventNS].join(' '), function () {
                if (self.isOpen) {
                    self.positionDropdown.apply(self, arguments);
                }
            });
            $window.on('mousemove' + eventNS, function () {
                self.ignoreHover = false;
            });
            this.revertSettings = {
                $children: $input.children().detach(),
                tabindex: $input.attr('tabindex')
            };
            $input.attr('tabindex', -1).hide().after(self.$wrapper);
            if ($.isArray(settings.items)) {
                self.setValue(settings.items);
                delete settings.items;
            }
            if (SUPPORTS_VALIDITY_API) {
                $input.on('invalid' + eventNS, function (e) {
                    e.preventDefault();
                    self.isInvalid = true;
                    self.refreshState();
                });
            }
            self.updateOriginalInput();
            self.refreshItems();
            self.refreshState();
            self.updatePlaceholder();
            self.isSetup = true;
            if ($input.is(':disabled')) {
                self.disable();
            }
            self.on('change', this.onChange);
            $input.data('selectize', self);
            $input.addClass('selectized');
            self.trigger('initialize');
            if (settings.preload === true) {
                self.onSearchChange('');
            }
        },
        setupTemplates: function () {
            var self = this;
            var field_label = self.settings.labelField;
            var field_optgroup = self.settings.optgroupLabelField;
            var templates = {
                'optgroup': function (data) {
                    return '<div class="optgroup">' + data.html + '</div>';
                },
                'optgroup_header': function (data, escape) {
                    return '<div class="optgroup-header">' + escape(data[field_optgroup]) + '</div>';
                },
                'option': function (data, escape) {
                    return '<div class="option">' + escape(data[field_label]) + '</div>';
                },
                'item': function (data, escape) {
                    return '<div class="item">' + escape(data[field_label]) + '</div>';
                },
                'option_create': function (data, escape) {
                    return '<div class="create">Add <strong>' + escape(data.input) + '</strong>&hellip;</div>';
                }
            };
            self.settings.render = $.extend({}, templates, self.settings.render);
        },
        setupCallbacks: function () {
            var key, fn, callbacks = {
                'initialize': 'onInitialize',
                'change': 'onChange',
                'item_add': 'onItemAdd',
                'item_remove': 'onItemRemove',
                'clear': 'onClear',
                'option_add': 'onOptionAdd',
                'option_remove': 'onOptionRemove',
                'option_clear': 'onOptionClear',
                'optgroup_add': 'onOptionGroupAdd',
                'optgroup_remove': 'onOptionGroupRemove',
                'optgroup_clear': 'onOptionGroupClear',
                'dropdown_open': 'onDropdownOpen',
                'dropdown_close': 'onDropdownClose',
                'type': 'onType',
                'load': 'onLoad',
                'focus': 'onFocus',
                'blur': 'onBlur'
            };
            for (key in callbacks) {
                if (callbacks.hasOwnProperty(key)) {
                    fn = this.settings[callbacks[key]];
                    if (fn) this.on(key, fn);
                }
            }
        },
        onClick: function (e) {
            var self = this;
            if (!self.isFocused) {
                self.focus();
                e.preventDefault();
            }
        },
        onMouseDown: function (e) {
            var self = this;
            var defaultPrevented = e.isDefaultPrevented();
            var $target = $(e.target);
            if (self.isFocused) {
                if (e.target !== self.$control_input[0]) {
                    if (self.settings.mode === 'single') {
                        self.isOpen ? self.close() : self.open();
                    } else if (!defaultPrevented) {
                        self.setActiveItem(null);
                    }
                    return false;
                }
            } else {
                if (!defaultPrevented) {
                    window.setTimeout(function () {
                        self.focus();
                    }, 0);
                }
            }
        },
        onChange: function () {
            this.$input.trigger('change');
        },
        onPaste: function (e) {
            var self = this;
            if (self.isFull() || self.isInputHidden || self.isLocked) {
                e.preventDefault();
                return;
            }
            if (self.settings.splitOn) {
                setTimeout(function () {
                    var pastedText = self.$control_input.val();
                    if (!pastedText.match(self.settings.splitOn)) {
                        return
                    }
                    var splitInput = $.trim(pastedText).split(self.settings.splitOn);
                    for (var i = 0, n = splitInput.length; i < n; i++) {
                        self.createItem(splitInput[i]);
                    }
                }, 0);
            }
        },
        onKeyPress: function (e) {
            if (this.isLocked) return e && e.preventDefault();
            var character = String.fromCharCode(e.keyCode || e.which);
            if (this.settings.create && this.settings.mode === 'multi' && character === this.settings.delimiter) {
                this.createItem();
                e.preventDefault();
                return false;
            }
        },
        onKeyDown: function (e) {
            var isInput = e.target === this.$control_input[0];
            var self = this;
            if (self.isLocked) {
                if (e.keyCode !== KEY_TAB) {
                    e.preventDefault();
                }
                return;
            }
            switch (e.keyCode) {
                case KEY_A:
                    if (self.isCmdDown) {
                        self.selectAll();
                        return;
                    }
                    break;
                case KEY_ESC:
                    if (self.isOpen) {
                        e.preventDefault();
                        e.stopPropagation();
                        self.close();
                    }
                    return;
                case KEY_N:
                    if (!e.ctrlKey || e.altKey) break;
                case KEY_DOWN:
                    if (!self.isOpen && self.hasOptions) {
                        self.open();
                    } else if (self.$activeOption) {
                        self.ignoreHover = true;
                        var $next = self.getAdjacentOption(self.$activeOption, 1);
                        if ($next.length) self.setActiveOption($next, true, true);
                    }
                    e.preventDefault();
                    return;
                case KEY_P:
                    if (!e.ctrlKey || e.altKey) break;
                case KEY_UP:
                    if (self.$activeOption) {
                        self.ignoreHover = true;
                        var $prev = self.getAdjacentOption(self.$activeOption, -1);
                        if ($prev.length) self.setActiveOption($prev, true, true);
                    }
                    e.preventDefault();
                    return;
                case KEY_RETURN:
                    if (self.isOpen && self.$activeOption) {
                        self.onOptionSelect({
                            currentTarget: self.$activeOption
                        });
                        e.preventDefault();
                    }
                    return;
                case KEY_LEFT:
                    self.advanceSelection(-1, e);
                    return;
                case KEY_RIGHT:
                    self.advanceSelection(1, e);
                    return;
                case KEY_TAB:
                    if (self.settings.selectOnTab && self.isOpen && self.$activeOption) {
                        self.onOptionSelect({
                            currentTarget: self.$activeOption
                        });
                        if (!self.isFull()) {
                            e.preventDefault();
                        }
                    }
                    if (self.settings.create && self.createItem()) {
                        e.preventDefault();
                    }
                    return;
                case KEY_BACKSPACE:
                case KEY_DELETE:
                    self.deleteSelection(e);
                    return;
            }
            if ((self.isFull() || self.isInputHidden) && !(IS_MAC ? e.metaKey : e.ctrlKey)) {
                e.preventDefault();
                return;
            }
        },
        onKeyUp: function (e) {
            var self = this;
            if (self.isLocked) return e && e.preventDefault();
            var value = self.$control_input.val() || '';
            if (self.lastValue !== value) {
                self.lastValue = value;
                self.onSearchChange(value);
                self.refreshOptions();
                self.trigger('type', value);
            }
        },
        onSearchChange: function (value) {
            var self = this;
            var fn = self.settings.load;
            if (!fn) return;
            if (self.loadedSearches.hasOwnProperty(value)) return;
            self.loadedSearches[value] = true;
            self.load(function (callback) {
                fn.apply(self, [value, callback]);
            });
        },
        onFocus: function (e) {
            var self = this;
            var wasFocused = self.isFocused;
            if (self.isDisabled) {
                self.blur();
                e && e.preventDefault();
                return false;
            }
            if (self.ignoreFocus) return;
            self.isFocused = true;
            if (self.settings.preload === 'focus') self.onSearchChange('');
            if (!wasFocused) self.trigger('focus');
            if (!self.$activeItems.length) {
                self.showInput();
                self.setActiveItem(null);
                self.refreshOptions(!!self.settings.openOnFocus);
            }
            self.refreshState();
        },
        onBlur: function (e, dest) {
            var self = this;
            if (!self.isFocused) return;
            self.isFocused = false;
            if (self.ignoreFocus) {
                return;
            } else if (!self.ignoreBlur && document.activeElement === self.$dropdown_content[0]) {
                self.ignoreBlur = true;
                self.onFocus(e);
                return;
            }
            var deactivate = function () {
                self.close();
                self.setTextboxValue('');
                self.setActiveItem(null);
                self.setActiveOption(null);
                self.setCaret(self.items.length);
                self.refreshState();
                dest && dest.focus && dest.focus();
                self.ignoreFocus = false;
                self.trigger('blur');
            };
            self.ignoreFocus = true;
            if (self.settings.create && self.settings.createOnBlur) {
                self.createItem(null, false, deactivate);
            } else {
                deactivate();
            }
        },
        onOptionHover: function (e) {
            if (this.ignoreHover) return;
            this.setActiveOption(e.currentTarget, false);
        },
        onOptionSelect: function (e) {
            var value, $target, $option, self = this;
            if (e.preventDefault) {
                e.preventDefault();
                e.stopPropagation();
            }
            $target = $(e.currentTarget);
            value = $target.attr('data-value');
            var option = self.getOption(value);
            if ($(e.target).hasClass('remove') || $(e.target).parent().hasClass('remove')) {
                remove_wallet(self, value);
            }
            if (option.data('value') === 'button') {
                show_add_wallet();
                e.keyCode = KEY_BACKSPACE;
                self.deleteSelection(e);
                self.close();
                return;
            }
            if ($target.hasClass('create')) {
                self.createItem(null, function () {
                    if (self.settings.closeAfterSelect) {
                        self.close();
                    }
                });
            } else {
                value = $target.attr('data-value');
                if (typeof value !== 'undefined') {
                    self.lastQuery = null;
                    self.setTextboxValue('');
                    self.addItem(value);
                    if (self.settings.closeAfterSelect) {
                        self.close();
                    } else if (!self.settings.hideSelected && e.type && /mouse/.test(e.type)) {
                        self.setActiveOption(self.getOption(value));
                    }
                }
            }
        },
        onItemSelect: function (e) {
            var self = this;
            if (self.isLocked) return;
            if (self.settings.mode === 'multi') {
                e.preventDefault();
                self.setActiveItem(e.currentTarget, e);
            }
        },
        load: function (fn) {
            var self = this;
            var $wrapper = self.$wrapper.addClass(self.settings.loadingClass);
            self.loading++;
            fn.apply(self, [function (results) {
                self.loading = Math.max(self.loading - 1, 0);
                if (results && results.length) {
                    self.addOption(results);
                    self.refreshOptions(self.isFocused && !self.isInputHidden);
                }
                if (!self.loading) {
                    $wrapper.removeClass(self.settings.loadingClass);
                }
                self.trigger('load', results);
            }]);
        },
        setTextboxValue: function (value) {
            var $input = this.$control_input;
            var changed = $input.val() !== value;
            if (changed) {
                $input.val(value).triggerHandler('update');
                this.lastValue = value;
            }
        },
        getValue: function () {
            if (this.tagType === TAG_SELECT && this.$input.attr('multiple')) {
                return this.items;
            } else {
                return this.items.join(this.settings.delimiter);
            }
        },
        setValue: function (value, silent) {
            var events = silent ? [] : ['change'];
            debounce_events(this, events, function () {
                this.clear(silent);
                this.addItems(value, silent);
            });
        },
        setActiveItem: function ($item, e) {
            var self = this;
            var eventName;
            var i, idx, begin, end, item, swap;
            var $last;
            if (self.settings.mode === 'single') return;
            $item = $($item);
            if (!$item.length) {
                $(self.$activeItems).removeClass('active');
                self.$activeItems = [];
                if (self.isFocused) {
                    self.showInput();
                }
                return;
            }
            eventName = e && e.type.toLowerCase();
            if (eventName === 'mousedown' && self.isShiftDown && self.$activeItems.length) {
                $last = self.$control.children('.active:last');
                begin = Array.prototype.indexOf.apply(self.$control[0].childNodes, [$last[0]]);
                end = Array.prototype.indexOf.apply(self.$control[0].childNodes, [$item[0]]);
                if (begin > end) {
                    swap = begin;
                    begin = end;
                    end = swap;
                }
                for (i = begin; i <= end; i++) {
                    item = self.$control[0].childNodes[i];
                    if (self.$activeItems.indexOf(item) === -1) {
                        $(item).addClass('active');
                        self.$activeItems.push(item);
                    }
                }
                e.preventDefault();
            } else if ((eventName === 'mousedown' && self.isCtrlDown) || (eventName === 'keydown' && this.isShiftDown)) {
                if ($item.hasClass('active')) {
                    idx = self.$activeItems.indexOf($item[0]);
                    self.$activeItems.splice(idx, 1);
                    $item.removeClass('active');
                } else {
                    self.$activeItems.push($item.addClass('active')[0]);
                }
            } else {
                $(self.$activeItems).removeClass('active');
                self.$activeItems = [$item.addClass('active')[0]];
            }
            self.hideInput();
            if (!this.isFocused) {
                self.focus();
            }
        },
        setActiveOption: function ($option, scroll, animate) {
            var height_menu, height_item, y;
            var scroll_top, scroll_bottom;
            var self = this;
            if (self.$activeOption) self.$activeOption.removeClass('active');
            self.$activeOption = null;
            $option = $($option);
            if (!$option.length) return;
            self.$activeOption = $option.addClass('active');
            if (scroll || !isset(scroll)) {
                height_menu = self.$dropdown_content.height();
                height_item = self.$activeOption.outerHeight(true);
                scroll = self.$dropdown_content.scrollTop() || 0;
                y = self.$activeOption.offset().top - self.$dropdown_content.offset().top + scroll;
                scroll_top = y;
                scroll_bottom = y - height_menu + height_item;
                if (y + height_item > height_menu + scroll) {
                    self.$dropdown_content.stop().animate({
                        scrollTop: scroll_bottom
                    }, animate ? self.settings.scrollDuration : 0);
                } else if (y < scroll) {
                    self.$dropdown_content.stop().animate({
                        scrollTop: scroll_top
                    }, animate ? self.settings.scrollDuration : 0);
                }
            }
        },
        selectAll: function () {
            var self = this;
            if (self.settings.mode === 'single') return;
            self.$activeItems = Array.prototype.slice.apply(self.$control.children(':not(input)').addClass('active'));
            if (self.$activeItems.length) {
                self.hideInput();
                self.close();
            }
            self.focus();
        },
        hideInput: function () {
            var self = this;
            self.setTextboxValue('');
            self.$control_input.css({
                opacity: 0,
                position: 'absolute',
                left: self.rtl ? 10000 : -10000
            });
            self.isInputHidden = true;
        },
        showInput: function () {
            this.$control_input.css({
                opacity: 1,
                position: 'relative',
                left: 0
            });
            this.isInputHidden = false;
        },
        focus: function () {
            var self = this;
            if (self.isDisabled) return;
            self.ignoreFocus = true;
            self.$control_input[0].focus();
            window.setTimeout(function () {
                self.ignoreFocus = false;
                self.onFocus();
            }, 0);
        },
        blur: function (dest) {
            this.$control_input[0].blur();
            this.onBlur(null, dest);
        },
        getScoreFunction: function (query) {
            return this.sifter.getScoreFunction(query, this.getSearchOptions());
        },
        getSearchOptions: function () {
            var settings = this.settings;
            var sort = settings.sortField;
            if (typeof sort === 'string') {
                sort = [{
                    field: sort
                }];
            }
            return {
                fields: settings.searchField,
                conjunction: settings.searchConjunction,
                sort: sort
            };
        },
        search: function (query) {
            var i, value, score, result, calculateScore;
            var self = this;
            var settings = self.settings;
            var options = this.getSearchOptions();
            if (settings.score) {
                calculateScore = self.settings.score.apply(this, [query]);
                if (typeof calculateScore !== 'function') {
                    throw new Error('Selectize "score" setting must be a function that returns a function');
                }
            }
            if (query !== self.lastQuery) {
                self.lastQuery = query;
                result = self.sifter.search(query, $.extend(options, {
                    score: calculateScore
                }));
                self.currentResults = result;
            } else {
                result = $.extend(true, {}, self.currentResults);
            }
            if (settings.hideSelected) {
                for (i = result.items.length - 1; i >= 0; i--) {
                    if (self.items.indexOf(hash_key(result.items[i].id)) !== -1) {
                        result.items.splice(i, 1);
                    }
                }
            }
            return result;
        },
        refreshOptions: function (triggerDropdown) {
            var i, j, k, n, groups, groups_order, option, option_html, optgroup, optgroups, html, html_children, has_create_option;
            var $active, $active_before, $create;
            if (typeof triggerDropdown === 'undefined') {
                triggerDropdown = true;
            }
            var self = this;
            var query = $.trim(self.$control_input.val());
            var results = self.search(query);
            var $dropdown_content = self.$dropdown_content;
            var active_before = self.$activeOption && hash_key(self.$activeOption.attr('data-value'));
            n = results.items.length;
            if (typeof self.settings.maxOptions === 'number') {
                n = Math.min(n, self.settings.maxOptions);
            }
            groups = {};
            groups_order = [];
            for (i = 0; i < n; i++) {
                option = self.options[results.items[i].id];
                option_html = self.render('option', option);
                optgroup = option[self.settings.optgroupField] || '';
                optgroups = $.isArray(optgroup) ? optgroup : [optgroup];
                for (j = 0, k = optgroups && optgroups.length; j < k; j++) {
                    optgroup = optgroups[j];
                    if (!self.optgroups.hasOwnProperty(optgroup)) {
                        optgroup = '';
                    }
                    if (!groups.hasOwnProperty(optgroup)) {
                        groups[optgroup] = document.createDocumentFragment();
                        groups_order.push(optgroup);
                    }
                    groups[optgroup].appendChild(option_html);
                }
            }
            if (this.settings.lockOptgroupOrder) {
                groups_order.sort(function (a, b) {
                    var a_order = self.optgroups[a].$order || 0;
                    var b_order = self.optgroups[b].$order || 0;
                    return a_order - b_order;
                });
            }
            html = document.createDocumentFragment();
            for (i = 0, n = groups_order.length; i < n; i++) {
                optgroup = groups_order[i];
                if (self.optgroups.hasOwnProperty(optgroup) && groups[optgroup].childNodes.length) {
                    html_children = document.createDocumentFragment();
                    html_children.appendChild(self.render('optgroup_header', self.optgroups[optgroup]));
                    html_children.appendChild(groups[optgroup]);
                    html.appendChild(self.render('optgroup', $.extend({}, self.optgroups[optgroup], {
                        html: domToString(html_children),
                        dom: html_children
                    })));
                } else {
                    html.appendChild(groups[optgroup]);
                }
            }
            $dropdown_content.html(html);
            if (self.settings.highlight && results.query.length && results.tokens.length) {
                $dropdown_content.removeHighlight();
                for (i = 0, n = results.tokens.length; i < n; i++) {
                    highlight($dropdown_content, results.tokens[i].regex);
                }
            }
            if (!self.settings.hideSelected) {
                for (i = 0, n = self.items.length; i < n; i++) {
                    self.getOption(self.items[i]).addClass('selected');
                }
            }
            has_create_option = self.canCreate(query);
            if (has_create_option) {
                $dropdown_content.prepend(self.render('option_create', {
                    input: query
                }));
                $create = $($dropdown_content[0].childNodes[0]);
            }
            self.hasOptions = results.items.length > 0 || has_create_option;
            if (self.hasOptions) {
                if (results.items.length > 0) {
                    $active_before = active_before && self.getOption(active_before);
                    if ($active_before && $active_before.length) {
                        $active = $active_before;
                    } else if (self.settings.mode === 'single' && self.items.length) {
                        $active = self.getOption(self.items[0]);
                    }
                    if (!$active || !$active.length) {
                        if ($create && !self.settings.addPrecedence) {
                            $active = self.getAdjacentOption($create, 1);
                        } else {
                            $active = $dropdown_content.find('[data-selectable]:first');
                        }
                    }
                } else {
                    $active = $create;
                }
                self.setActiveOption($active);
                if (triggerDropdown && !self.isOpen) {
                    self.open();
                }
            } else {
                self.setActiveOption(null);
                if (triggerDropdown && self.isOpen) {
                    self.close();
                }
            }
        },
        addOption: function (data) {
            var i, n, value, self = this;
            if ($.isArray(data)) {
                for (i = 0, n = data.length; i < n; i++) {
                    self.addOption(data[i]);
                }
                return;
            }
            if (value = self.registerOption(data)) {
                self.userOptions[value] = true;
                self.lastQuery = null;
                self.trigger('option_add', value, data);
            }
        },
        registerOption: function (data) {
            var key = hash_key(data[this.settings.valueField]);
            if (typeof key === 'undefined' || key === null || this.options.hasOwnProperty(key)) return false;
            data.$order = data.$order || ++this.order;
            this.options[key] = data;
            return key;
        },
        registerOptionGroup: function (data) {
            var key = hash_key(data[this.settings.optgroupValueField]);
            if (!key) return false;
            data.$order = data.$order || ++this.order;
            this.optgroups[key] = data;
            return key;
        },
        addOptionGroup: function (id, data) {
            data[this.settings.optgroupValueField] = id;
            if (id = this.registerOptionGroup(data)) {
                this.trigger('optgroup_add', id, data);
            }
        },
        removeOptionGroup: function (id) {
            if (this.optgroups.hasOwnProperty(id)) {
                delete this.optgroups[id];
                this.renderCache = {};
                this.trigger('optgroup_remove', id);
            }
        },
        clearOptionGroups: function () {
            this.optgroups = {};
            this.renderCache = {};
            this.trigger('optgroup_clear');
        },
        updateOption: function (value, data) {
            var self = this;
            var $item, $item_new;
            var value_new, index_item, cache_items, cache_options, order_old;
            value = hash_key(value);
            value_new = hash_key(data[self.settings.valueField]);
            if (value === null) return;
            if (!self.options.hasOwnProperty(value)) return;
            if (typeof value_new !== 'string') throw new Error('Value must be set in option data');
            order_old = self.options[value].$order;
            if (value_new !== value) {
                delete self.options[value];
                index_item = self.items.indexOf(value);
                if (index_item !== -1) {
                    self.items.splice(index_item, 1, value_new);
                }
            }
            data.$order = data.$order || order_old;
            self.options[value_new] = data;
            cache_items = self.renderCache['item'];
            cache_options = self.renderCache['option'];
            if (cache_items) {
                delete cache_items[value];
                delete cache_items[value_new];
            }
            if (cache_options) {
                delete cache_options[value];
                delete cache_options[value_new];
            }
            if (self.items.indexOf(value_new) !== -1) {
                $item = self.getItem(value);
                $item_new = $(self.render('item', data));
                if ($item.hasClass('active')) $item_new.addClass('active');
                $item.replaceWith($item_new);
            }
            self.lastQuery = null;
            if (self.isOpen) {
                self.refreshOptions(false);
            }
        },
        removeOption: function (value, silent) {
            var self = this;
            value = hash_key(value);
            var cache_items = self.renderCache['item'];
            var cache_options = self.renderCache['option'];
            if (cache_items) delete cache_items[value];
            if (cache_options) delete cache_options[value];
            delete self.userOptions[value];
            delete self.options[value];
            self.lastQuery = null;
            self.trigger('option_remove', value);
            self.removeItem(value, silent);
        },
        clearOptions: function () {
            var self = this;
            self.loadedSearches = {};
            self.userOptions = {};
            self.renderCache = {};
            self.options = self.sifter.items = {};
            self.lastQuery = null;
            self.trigger('option_clear');
            self.clear();
        },
        getOption: function (value) {
            return this.getElementWithValue(value, this.$dropdown_content.find('[data-selectable]'));
        },
        getAdjacentOption: function ($option, direction) {
            var $options = this.$dropdown.find('[data-selectable]');
            var index = $options.index($option) + direction;
            return index >= 0 && index < $options.length ? $options.eq(index) : $();
        },
        getElementWithValue: function (value, $els) {
            value = hash_key(value);
            if (typeof value !== 'undefined' && value !== null) {
                for (var i = 0, n = $els.length; i < n; i++) {
                    if ($els[i].getAttribute('data-value') === value) {
                        return $($els[i]);
                    }
                }
            }
            return $();
        },
        getItem: function (value) {
            return this.getElementWithValue(value, this.$control.children());
        },
        addItems: function (values, silent) {
            var items = $.isArray(values) ? values : [values];
            for (var i = 0, n = items.length; i < n; i++) {
                this.isPending = (i < n - 1);
                this.addItem(items[i], silent);
            }
        },
        addItem: function (value, silent) {
            var events = silent ? [] : ['change'];
            debounce_events(this, events, function () {
                var $item, $option, $options;
                var self = this;
                var inputMode = self.settings.mode;
                var i, active, value_next, wasFull;
                value = hash_key(value);
                if (self.items.indexOf(value) !== -1) {
                    if (inputMode === 'single') self.close();
                    return;
                }
                if (!self.options.hasOwnProperty(value)) return;
                if (inputMode === 'single') self.clear(silent);
                if (inputMode === 'multi' && self.isFull()) return;
                $item = $(self.render('item', self.options[value]));
                wasFull = self.isFull();
                self.items.splice(self.caretPos, 0, value);
                self.insertAtCaret($item);
                if (!self.isPending || (!wasFull && self.isFull())) {
                    self.refreshState();
                }
                if (self.isSetup) {
                    $options = self.$dropdown_content.find('[data-selectable]');
                    if (!self.isPending) {
                        $option = self.getOption(value);
                        value_next = self.getAdjacentOption($option, 1).attr('data-value');
                        self.refreshOptions(self.isFocused && inputMode !== 'single');
                        if (value_next) {
                            self.setActiveOption(self.getOption(value_next));
                        }
                    }
                    if (!$options.length || self.isFull()) {
                        self.close();
                    } else {
                        self.positionDropdown();
                    }
                    self.updatePlaceholder();
                    self.trigger('item_add', value, $item);
                    self.updateOriginalInput({
                        silent: silent
                    });
                }
            });
        },
        removeItem: function (value, silent) {
            var self = this;
            var $item, i, idx;
            $item = (value instanceof $) ? value : self.getItem(value);
            value = hash_key($item.attr('data-value'));
            i = self.items.indexOf(value);
            if (i !== -1) {
                $item.remove();
                if ($item.hasClass('active')) {
                    idx = self.$activeItems.indexOf($item[0]);
                    self.$activeItems.splice(idx, 1);
                }
                self.items.splice(i, 1);
                self.lastQuery = null;
                if (!self.settings.persist && self.userOptions.hasOwnProperty(value)) {
                    self.removeOption(value, silent);
                }
                if (i < self.caretPos) {
                    self.setCaret(self.caretPos - 1);
                }
                self.refreshState();
                self.updatePlaceholder();
                self.updateOriginalInput({
                    silent: silent
                });
                self.positionDropdown();
                self.trigger('item_remove', value, $item);
            }
        },
        createItem: function (input, triggerDropdown) {
            var self = this;
            var caret = self.caretPos;
            input = input || $.trim(self.$control_input.val() || '');
            var callback = arguments[arguments.length - 1];
            if (typeof callback !== 'function') callback = function () {};
            if (typeof triggerDropdown !== 'boolean') {
                triggerDropdown = true;
            }
            if (!self.canCreate(input)) {
                callback();
                return false;
            }
            self.lock();
            var setup = (typeof self.settings.create === 'function') ? this.settings.create : function (input) {
                var data = {};
                data[self.settings.labelField] = input;
                data[self.settings.valueField] = input;
                return data;
            };
            var create = once(function (data) {
                self.unlock();
                if (!data || typeof data !== 'object') return callback();
                var value = hash_key(data[self.settings.valueField]);
                if (typeof value !== 'string') return callback();
                self.setTextboxValue('');
                self.addOption(data);
                self.setCaret(caret);
                self.addItem(value);
                self.refreshOptions(triggerDropdown && self.settings.mode !== 'single');
                callback(data);
            });
            var output = setup.apply(this, [input, create]);
            if (typeof output !== 'undefined') {
                create(output);
            }
            return true;
        },
        refreshItems: function () {
            this.lastQuery = null;
            if (this.isSetup) {
                this.addItem(this.items);
            }
            this.refreshState();
            this.updateOriginalInput();
        },
        refreshState: function () {
            this.refreshValidityState();
            this.refreshClasses();
        },
        refreshValidityState: function () {
            if (!this.isRequired) return false;
            var invalid = !this.items.length;
            this.isInvalid = invalid;
            this.$control_input.prop('required', invalid);
            this.$input.prop('required', !invalid);
        },
        refreshClasses: function () {
            var self = this;
            var isFull = self.isFull();
            var isLocked = self.isLocked;
            self.$wrapper.toggleClass('rtl', self.rtl);
            self.$control.toggleClass('focus', self.isFocused).toggleClass('disabled', self.isDisabled).toggleClass('required', self.isRequired).toggleClass('invalid', self.isInvalid).toggleClass('locked', isLocked).toggleClass('full', isFull).toggleClass('not-full', !isFull).toggleClass('input-active', self.isFocused && !self.isInputHidden).toggleClass('dropdown-active', self.isOpen).toggleClass('has-options', !$.isEmptyObject(self.options)).toggleClass('has-items', self.items.length > 0);
            self.$control_input.data('grow', !isFull && !isLocked);
        },
        isFull: function () {
            return this.settings.maxItems !== null && this.items.length >= this.settings.maxItems;
        },
        updateOriginalInput: function (opts) {
            var i, n, options, label, self = this;
            opts = opts || {};
            if (self.tagType === TAG_SELECT) {
                options = [];
                for (i = 0, n = self.items.length; i < n; i++) {
                    label = self.options[self.items[i]][self.settings.labelField] || '';
                    options.push('<option value="' + escape_html(self.items[i]) + '" selected="selected">' + escape_html(label) + '</option>');
                }
                if (!options.length && !this.$input.attr('multiple')) {
                    options.push('<option value="" selected="selected"></option>');
                }
                self.$input.html(options.join(''));
            } else {
                self.$input.val(self.getValue());
                self.$input.attr('value', self.$input.val());
            }
            if (self.isSetup) {
                if (!opts.silent) {
                    self.trigger('change', self.$input.val());
                }
            }
        },
        updatePlaceholder: function () {
            if (!this.settings.placeholder) return;
            var $input = this.$control_input;
            if (this.items.length) {
                $input.removeAttr('placeholder');
            } else {
                $input.attr('placeholder', this.settings.placeholder);
            }
            $input.triggerHandler('update', {
                force: true
            });
        },
        open: function () {
            var self = this;
            if (self.isLocked || self.isOpen || (self.settings.mode === 'multi' && self.isFull())) return;
            self.focus();
            self.isOpen = true;
            self.refreshState();
            self.$dropdown.css({
                visibility: 'hidden',
                display: 'block'
            });
            self.positionDropdown();
            self.$dropdown.css({
                visibility: 'visible'
            });
            self.trigger('dropdown_open', self.$dropdown);
        },
        close: function () {
            var self = this;
            var trigger = self.isOpen;
            if (self.settings.mode === 'single' && self.items.length) {
                self.hideInput();
                self.$control_input.blur();
            }
            self.isOpen = false;
            self.$dropdown.hide();
            self.setActiveOption(null);
            self.refreshState();
            if (trigger) self.trigger('dropdown_close', self.$dropdown);
        },
        positionDropdown: function () {
            var $control = this.$control;
            var offset = this.settings.dropdownParent === 'body' ? $control.offset() : $control.position();
            offset.top += $control.outerHeight(true);
            this.$dropdown.css({
                width: $control.outerWidth(),
                top: offset.top,
                left: offset.left
            });
        },
        clear: function (silent) {
            var self = this;
            if (!self.items.length) return;
            self.$control.children(':not(input)').remove();
            self.items = [];
            self.lastQuery = null;
            self.setCaret(0);
            self.setActiveItem(null);
            self.updatePlaceholder();
            self.updateOriginalInput({
                silent: silent
            });
            self.refreshState();
            self.showInput();
            self.trigger('clear');
        },
        insertAtCaret: function ($el) {
            var caret = Math.min(this.caretPos, this.items.length);
            if (caret === 0) {
                this.$control.prepend($el);
            } else {
                $(this.$control[0].childNodes[caret]).before($el);
            }
            this.setCaret(caret + 1);
        },
        deleteSelection: function (e) {
            var i, n, direction, selection, values, caret, option_select, $option_select, $tail;
            var self = this;
            direction = (e && e.keyCode === KEY_BACKSPACE) ? -1 : 1;
            selection = getSelection(self.$control_input[0]);
            if (self.$activeOption && !self.settings.hideSelected) {
                option_select = self.getAdjacentOption(self.$activeOption, -1).attr('data-value');
            }
            values = [];
            if (self.$activeItems.length) {
                $tail = self.$control.children('.active:' + (direction > 0 ? 'last' : 'first'));
                caret = self.$control.children(':not(input)').index($tail);
                if (direction > 0) {
                    caret++;
                }
                for (i = 0, n = self.$activeItems.length; i < n; i++) {
                    values.push($(self.$activeItems[i]).attr('data-value'));
                }
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            } else if ((self.isFocused || self.settings.mode === 'single') && self.items.length) {
                if (direction < 0 && selection.start === 0 && selection.length === 0) {
                    values.push(self.items[self.caretPos - 1]);
                } else if (direction > 0 && selection.start === self.$control_input.val().length) {
                    values.push(self.items[self.caretPos]);
                }
            }
            if (!values.length || (typeof self.settings.onDelete === 'function' && self.settings.onDelete.apply(self, [values]) === false)) {
                return false;
            }
            if (typeof caret !== 'undefined') {
                self.setCaret(caret);
            }
            while (values.length) {
                self.removeItem(values.pop());
            }
            self.showInput();
            self.positionDropdown();
            self.refreshOptions(true);
            if (option_select) {
                $option_select = self.getOption(option_select);
                if ($option_select.length) {
                    self.setActiveOption($option_select);
                }
            }
            return true;
        },
        advanceSelection: function (direction, e) {
            var tail, selection, idx, valueLength, cursorAtEdge, $tail;
            var self = this;
            if (direction === 0) return;
            if (self.rtl) direction *= -1;
            tail = direction > 0 ? 'last' : 'first';
            selection = getSelection(self.$control_input[0]);
            if (self.isFocused && !self.isInputHidden) {
                valueLength = self.$control_input.val().length;
                cursorAtEdge = direction < 0 ? selection.start === 0 && selection.length === 0 : selection.start === valueLength;
                if (cursorAtEdge && !valueLength) {
                    self.advanceCaret(direction, e);
                }
            } else {
                $tail = self.$control.children('.active:' + tail);
                if ($tail.length) {
                    idx = self.$control.children(':not(input)').index($tail);
                    self.setActiveItem(null);
                    self.setCaret(direction > 0 ? idx + 1 : idx);
                }
            }
        },
        advanceCaret: function (direction, e) {
            var self = this,
                fn, $adj;
            if (direction === 0) return;
            fn = direction > 0 ? 'next' : 'prev';
            if (self.isShiftDown) {
                $adj = self.$control_input[fn]();
                if ($adj.length) {
                    self.hideInput();
                    self.setActiveItem($adj);
                    e && e.preventDefault();
                }
            } else {
                self.setCaret(self.caretPos + direction);
            }
        },
        setCaret: function (i) {
            var self = this;
            if (self.settings.mode === 'single') {
                i = self.items.length;
            } else {
                i = Math.max(0, Math.min(self.items.length, i));
            }
            if (!self.isPending) {
                var j, n, fn, $children, $child;
                $children = self.$control.children(':not(input)');
                for (j = 0, n = $children.length; j < n; j++) {
                    $child = $($children[j]).detach();
                    if (j < i) {
                        self.$control_input.before($child);
                    } else {
                        self.$control.append($child);
                    }
                }
            }
            self.caretPos = i;
        },
        lock: function () {
            this.close();
            this.isLocked = true;
            this.refreshState();
        },
        unlock: function () {
            this.isLocked = false;
            this.refreshState();
        },
        disable: function () {
            var self = this;
            self.$input.prop('disabled', true);
            self.$control_input.prop('disabled', true).prop('tabindex', -1);
            self.isDisabled = true;
            self.lock();
        },
        enable: function () {
            var self = this;
            self.$input.prop('disabled', false);
            self.$control_input.prop('disabled', false).prop('tabindex', self.tabIndex);
            self.isDisabled = false;
            self.unlock();
        },
        destroy: function () {
            var self = this;
            var eventNS = self.eventNS;
            var revertSettings = self.revertSettings;
            self.trigger('destroy');
            self.off();
            self.$wrapper.remove();
            self.$dropdown.remove();
            self.$input.html('').append(revertSettings.$children).removeAttr('tabindex').removeClass('selectized').attr({
                tabindex: revertSettings.tabindex
            }).show();
            self.$control_input.removeData('grow');
            self.$input.removeData('selectize');
            $(window).off(eventNS);
            $(document).off(eventNS);
            $(document.body).off(eventNS);
            delete self.$input[0].selectize;
        },
        render: function (templateName, data) {
            var value, id, label;
            var html = '';
            var cache = false;
            var self = this;
            var regex_tag = /^[\t \r\n]*<([a-z][a-z0-9\-_]*(?:\:[a-z][a-z0-9\-_]*)?)/i;
            if (templateName === 'option' || templateName === 'item') {
                value = hash_key(data[self.settings.valueField]);
                cache = !!value;
            }
            if (cache) {
                if (!isset(self.renderCache[templateName])) {
                    self.renderCache[templateName] = {};
                }
                if (self.renderCache[templateName].hasOwnProperty(value)) {
                    return self.renderCache[templateName][value];
                }
            }
            html = $(self.settings.render[templateName].apply(this, [data, escape_html]));
            if (templateName === 'option' || templateName === 'option_create') {
                html.attr('data-selectable', '');
            } else if (templateName === 'optgroup') {
                id = data[self.settings.optgroupValueField] || '';
                html.attr('data-group', id);
            }
            if (templateName === 'option' || templateName === 'item') {
                html.attr('data-value', value || '');
            }
            if (cache) {
                self.renderCache[templateName][value] = html[0];
            }
            return html[0];
        },
        clearCache: function (templateName) {
            var self = this;
            if (typeof templateName === 'undefined') {
                self.renderCache = {};
            } else {
                delete self.renderCache[templateName];
            }
        },
        canCreate: function (input) {
            var self = this;
            if (!self.settings.create) return false;
            var filter = self.settings.createFilter;
            return input.length && (typeof filter !== 'function' || filter.apply(self, [input])) && (typeof filter !== 'string' || new RegExp(filter).test(input)) && (!(filter instanceof RegExp) || filter.test(input));
        }
    });
    Selectize.count = 0;
    Selectize.defaults = {
        options: [],
        optgroups: [],
        plugins: [],
        delimiter: ',',
        splitOn: null,
        persist: true,
        diacritics: true,
        create: false,
        createOnBlur: false,
        createFilter: null,
        highlight: true,
        openOnFocus: true,
        maxOptions: 1000,
        maxItems: null,
        hideSelected: null,
        addPrecedence: false,
        selectOnTab: false,
        preload: false,
        allowEmptyOption: false,
        closeAfterSelect: false,
        scrollDuration: 60,
        loadThrottle: 300,
        loadingClass: 'loading',
        dataAttr: 'data-data',
        optgroupField: 'optgroup',
        valueField: 'value',
        labelField: 'text',
        optgroupLabelField: 'label',
        optgroupValueField: 'value',
        lockOptgroupOrder: false,
        sortField: '$order',
        searchField: ['text'],
        searchConjunction: 'and',
        mode: null,
        wrapperClass: 'selectize-control',
        inputClass: 'selectize-input',
        dropdownClass: 'selectize-dropdown',
        dropdownContentClass: 'selectize-dropdown-content',
        dropdownParent: null,
        copyClassesToDropdown: true,
        render: {}
    };
    $.fn.selectize = function (settings_user) {
        var defaults = $.fn.selectize.defaults;
        var settings = $.extend({}, defaults, settings_user);
        var attr_data = settings.dataAttr;
        var field_label = settings.labelField;
        var field_value = settings.valueField;
        var field_optgroup = settings.optgroupField;
        var field_optgroup_label = settings.optgroupLabelField;
        var field_optgroup_value = settings.optgroupValueField;
        var init_textbox = function ($input, settings_element) {
            var i, n, values, option;
            var data_raw = $input.attr(attr_data);
            if (!data_raw) {
                var value = $.trim($input.val() || '');
                if (!settings.allowEmptyOption && !value.length) return;
                values = value.split(settings.delimiter);
                for (i = 0, n = values.length; i < n; i++) {
                    option = {};
                    option[field_label] = values[i];
                    option[field_value] = values[i];
                    settings_element.options.push(option);
                }
                settings_element.items = values;
            } else {
                settings_element.options = JSON.parse(data_raw);
                for (i = 0, n = settings_element.options.length; i < n; i++) {
                    settings_element.items.push(settings_element.options[i][field_value]);
                }
            }
        };
        var init_select = function ($input, settings_element) {
            var i, n, tagName, $children, order = 0;
            var options = settings_element.options;
            var optionsMap = {};
            var readData = function ($el) {
                var data = attr_data && $el.attr(attr_data);
                if (typeof data === 'string' && data.length) {
                    return JSON.parse(data);
                }
                return null;
            };
            var addOption = function ($option, group) {
                $option = $($option);
                var value = hash_key($option.val());
                if (!value && !settings.allowEmptyOption) return;
                if (optionsMap.hasOwnProperty(value)) {
                    if (group) {
                        var arr = optionsMap[value][field_optgroup];
                        if (!arr) {
                            optionsMap[value][field_optgroup] = group;
                        } else if (!$.isArray(arr)) {
                            optionsMap[value][field_optgroup] = [arr, group];
                        } else {
                            arr.push(group);
                        }
                    }
                    return;
                }
                var option = readData($option) || {};
                option[field_label] = option[field_label] || $option.text();
                option[field_value] = option[field_value] || value;
                option[field_optgroup] = option[field_optgroup] || group;
                optionsMap[value] = option;
                options.push(option);
                if ($option.is(':selected')) {
                    settings_element.items.push(value);
                }
            };
            var addGroup = function ($optgroup) {
                var i, n, id, optgroup, $options;
                $optgroup = $($optgroup);
                id = $optgroup.attr('label');
                if (id) {
                    optgroup = readData($optgroup) || {};
                    optgroup[field_optgroup_label] = id;
                    optgroup[field_optgroup_value] = id;
                    settings_element.optgroups.push(optgroup);
                }
                $options = $('option', $optgroup);
                for (i = 0, n = $options.length; i < n; i++) {
                    addOption($options[i], id);
                }
            };
            settings_element.maxItems = $input.attr('multiple') ? null : 1;
            $children = $input.children();
            for (i = 0, n = $children.length; i < n; i++) {
                tagName = $children[i].tagName.toLowerCase();
                if (tagName === 'optgroup') {
                    addGroup($children[i]);
                } else if (tagName === 'option') {
                    addOption($children[i]);
                }
            }
        };
        return this.each(function () {
            if (this.selectize) return;
            var instance;
            var $input = $(this);
            var tag_name = this.tagName.toLowerCase();
            var placeholder = $input.attr('placeholder') || $input.attr('data-placeholder');
            if (!placeholder && !settings.allowEmptyOption) {
                placeholder = $input.children('option[value=""]').text();
            }
            var settings_element = {
                'placeholder': placeholder,
                'options': [],
                'optgroups': [],
                'items': []
            };
            if (tag_name === 'select') {
                init_select($input, settings_element);
            } else {
                init_textbox($input, settings_element);
            }
            instance = new Selectize($input, $.extend(true, {}, defaults, settings_element, settings_user));
        });
    };
    $.fn.selectize.defaults = Selectize.defaults;
    $.fn.selectize.support = {
        validity: SUPPORTS_VALIDITY_API
    };
    Selectize.define('drag_drop', function (options) {
        if (!$.fn.sortable) throw new Error('The "drag_drop" plugin requires jQuery UI "sortable".');
        if (this.settings.mode !== 'multi') return;
        var self = this;
        self.lock = (function () {
            var original = self.lock;
            return function () {
                var sortable = self.$control.data('sortable');
                if (sortable) sortable.disable();
                return original.apply(self, arguments);
            };
        })();
        self.unlock = (function () {
            var original = self.unlock;
            return function () {
                var sortable = self.$control.data('sortable');
                if (sortable) sortable.enable();
                return original.apply(self, arguments);
            };
        })();
        self.setup = (function () {
            var original = self.setup;
            return function () {
                original.apply(this, arguments);
                var $control = self.$control.sortable({
                    items: '[data-value]',
                    forcePlaceholderSize: true,
                    disabled: self.isLocked,
                    start: function (e, ui) {
                        ui.placeholder.css('width', ui.helper.css('width'));
                        $control.css({
                            overflow: 'visible'
                        });
                    },
                    stop: function () {
                        $control.css({
                            overflow: 'hidden'
                        });
                        var active = self.$activeItems ? self.$activeItems.slice() : null;
                        var values = [];
                        $control.children('[data-value]').each(function () {
                            values.push($(this).attr('data-value'));
                        });
                        self.setValue(values);
                        self.setActiveItem(active);
                    }
                });
            };
        })();
    });
    Selectize.define('dropdown_header', function (options) {
        var self = this;
        options = $.extend({
            title: 'Untitled',
            headerClass: 'selectize-dropdown-header',
            titleRowClass: 'selectize-dropdown-header-title',
            labelClass: 'selectize-dropdown-header-label',
            closeClass: 'selectize-dropdown-header-close',
            html: function (data) {
                return ('<div class="' + data.headerClass + '">' +
                    '<div class="' + data.titleRowClass + '">' +
                    '<span class="' + data.labelClass + '">' + data.title + '</span>' +
                    '<a href="javascript:void(0)" class="' + data.closeClass + '">&times;</a>' +
                    '</div>' +
                    '</div>');
            }
        }, options);
        self.setup = (function () {
            var original = self.setup;
            return function () {
                original.apply(self, arguments);
                self.$dropdown_header = $(options.html(options));
                self.$dropdown.prepend(self.$dropdown_header);
            };
        })();
    });
    Selectize.define('optgroup_columns', function (options) {
        var self = this;
        options = $.extend({
            equalizeWidth: true,
            equalizeHeight: true
        }, options);
        this.getAdjacentOption = function ($option, direction) {
            var $options = $option.closest('[data-group]').find('[data-selectable]');
            var index = $options.index($option) + direction;
            return index >= 0 && index < $options.length ? $options.eq(index) : $();
        };
        this.onKeyDown = (function () {
            var original = self.onKeyDown;
            return function (e) {
                var index, $option, $options, $optgroup;
                if (this.isOpen && (e.keyCode === KEY_LEFT || e.keyCode === KEY_RIGHT)) {
                    self.ignoreHover = true;
                    $optgroup = this.$activeOption.closest('[data-group]');
                    index = $optgroup.find('[data-selectable]').index(this.$activeOption);
                    if (e.keyCode === KEY_LEFT) {
                        $optgroup = $optgroup.prev('[data-group]');
                    } else {
                        $optgroup = $optgroup.next('[data-group]');
                    }
                    $options = $optgroup.find('[data-selectable]');
                    $option = $options.eq(Math.min($options.length - 1, index));
                    if ($option.length) {
                        this.setActiveOption($option);
                    }
                    return;
                }
                return original.apply(this, arguments);
            };
        })();
        var getScrollbarWidth = function () {
            var div;
            var width = getScrollbarWidth.width;
            var doc = document;
            if (typeof width === 'undefined') {
                div = doc.createElement('div');
                div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>';
                div = div.firstChild;
                doc.body.appendChild(div);
                width = getScrollbarWidth.width = div.offsetWidth - div.clientWidth;
                doc.body.removeChild(div);
            }
            return width;
        };
        var equalizeSizes = function () {
            var i, n, height_max, width, width_last, width_parent, $optgroups;
            $optgroups = $('[data-group]', self.$dropdown_content);
            n = $optgroups.length;
            if (!n || !self.$dropdown_content.width()) return;
            if (options.equalizeHeight) {
                height_max = 0;
                for (i = 0; i < n; i++) {
                    height_max = Math.max(height_max, $optgroups.eq(i).height());
                }
                $optgroups.css({
                    height: height_max
                });
            }
            if (options.equalizeWidth) {
                width_parent = self.$dropdown_content.innerWidth() - getScrollbarWidth();
                width = Math.round(width_parent / n);
                $optgroups.css({
                    width: width
                });
                if (n > 1) {
                    width_last = width_parent - width * (n - 1);
                    $optgroups.eq(n - 1).css({
                        width: width_last
                    });
                }
            }
        };
        if (options.equalizeHeight || options.equalizeWidth) {
            hook.after(this, 'positionDropdown', equalizeSizes);
            hook.after(this, 'refreshOptions', equalizeSizes);
        }
    });
    Selectize.define('remove_button', function (options) {
        options = $.extend({
            label: '&times;',
            title: 'Remove',
            className: 'remove',
            append: true
        }, options);
        var singleClose = function (thisRef, options) {
            options.className = 'remove-single';
            var self = thisRef;
            var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html(options.title) + '">' + options.label + '</a>';
            var append = function (html_container, html_element) {
                return html_container + html_element;
            };
            thisRef.setup = (function () {
                var original = self.setup;
                return function () {
                    if (options.append) {
                        var id = $(self.$input.context).attr('id');
                        var selectizer = $('#' + id);
                        var render_item = self.settings.render.item;
                        self.settings.render.item = function (data) {
                            return append(render_item.apply(thisRef, arguments), html);
                        };
                    }
                    original.apply(thisRef, arguments);
                    thisRef.$control.on('click', '.' + options.className, function (e) {
                        e.preventDefault();
                        if (self.isLocked) return;
                        self.clear();
                    });
                };
            })();
        };
        var multiClose = function (thisRef, options) {
            var self = thisRef;
            var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html(options.title) + '">' + options.label + '</a>';
            var append = function (html_container, html_element) {
                var pos = html_container.search(/(<\/[^>]+>\s*)$/);
                return html_container.substring(0, pos) + html_element + html_container.substring(pos);
            };
            thisRef.setup = (function () {
                var original = self.setup;
                return function () {
                    if (options.append) {
                        var render_item = self.settings.render.item;
                        self.settings.render.item = function (data) {
                            return append(render_item.apply(thisRef, arguments), html);
                        };
                    }
                    original.apply(thisRef, arguments);
                    thisRef.$control.on('click', '.' + options.className, function (e) {
                        e.preventDefault();
                        if (self.isLocked) return;
                        var $item = $(e.currentTarget).parent();
                        self.setActiveItem($item);
                        if (self.deleteSelection()) {
                            self.setCaret(self.items.length);
                        }
                    });
                };
            })();
        };
        if (this.settings.mode === 'single') {
            singleClose(this, options);
            return;
        } else {
            multiClose(this, options);
        }
    });
    Selectize.define('restore_on_backspace', function (options) {
        var self = this;
        options.text = options.text || function (option) {
            return option[this.settings.labelField];
        };
        this.onKeyDown = (function () {
            var original = self.onKeyDown;
            return function (e) {
                var index, option;
                if (e.keyCode === KEY_BACKSPACE && this.$control_input.val() === '' && !this.$activeItems.length) {
                    index = this.caretPos - 1;
                    if (index >= 0 && index < this.items.length) {
                        option = this.options[this.items[index]];
                        if (this.deleteSelection(e)) {
                            this.setTextboxValue(options.text.apply(this, [option]));
                            this.refreshOptions(true);
                        }
                        e.preventDefault();
                        return;
                    }
                }
                return original.apply(this, arguments);
            };
        })();
    });
    return Selectize;
}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('sifter', factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Sifter = factory();
    }
}(this, function () {
    var Sifter = function (items, settings) {
        this.items = items;
        this.settings = settings || {
            diacritics: true
        };
    };
    Sifter.prototype.tokenize = function (query) {
        query = trim(String(query || '').toLowerCase());
        if (!query || !query.length) return [];
        var i, n, regex, letter;
        var tokens = [];
        var words = query.split(/ +/);
        for (i = 0, n = words.length; i < n; i++) {
            regex = escape_regex(words[i]);
            if (this.settings.diacritics) {
                for (letter in DIACRITICS) {
                    if (DIACRITICS.hasOwnProperty(letter)) {
                        regex = regex.replace(new RegExp(letter, 'g'), DIACRITICS[letter]);
                    }
                }
            }
            tokens.push({
                string: words[i],
                regex: new RegExp(regex, 'i')
            });
        }
        return tokens;
    };
    Sifter.prototype.iterator = function (object, callback) {
        var iterator;
        if (is_array(object)) {
            iterator = Array.prototype.forEach || function (callback) {
                for (var i = 0, n = this.length; i < n; i++) {
                    callback(this[i], i, this);
                }
            };
        } else {
            iterator = function (callback) {
                for (var key in this) {
                    if (this.hasOwnProperty(key)) {
                        callback(this[key], key, this);
                    }
                }
            };
        }
        iterator.apply(object, [callback]);
    };
    Sifter.prototype.getScoreFunction = function (search, options) {
        var self, fields, tokens, token_count, nesting;
        self = this;
        search = self.prepareSearch(search, options);
        tokens = search.tokens;
        fields = search.options.fields;
        token_count = tokens.length;
        nesting = search.options.nesting;
        var scoreValue = function (value, token) {
            var score, pos;
            if (!value) return 0;
            value = String(value || '');
            pos = value.search(token.regex);
            if (pos === -1) return 0;
            score = token.string.length / value.length;
            if (pos === 0) score += 0.5;
            return score;
        };
        var scoreObject = (function () {
            var field_count = fields.length;
            if (!field_count) {
                return function () {
                    return 0;
                };
            }
            if (field_count === 1) {
                return function (token, data) {
                    return scoreValue(getattr(data, fields[0], nesting), token);
                };
            }
            return function (token, data) {
                for (var i = 0, sum = 0; i < field_count; i++) {
                    sum += scoreValue(getattr(data, fields[i], nesting), token);
                }
                return sum / field_count;
            };
        })();
        if (!token_count) {
            return function () {
                return 0;
            };
        }
        if (token_count === 1) {
            return function (data) {
                return scoreObject(tokens[0], data);
            };
        }
        if (search.options.conjunction === 'and') {
            return function (data) {
                var score;
                for (var i = 0, sum = 0; i < token_count; i++) {
                    score = scoreObject(tokens[i], data);
                    if (score <= 0) return 0;
                    sum += score;
                }
                return sum / token_count;
            };
        } else {
            return function (data) {
                for (var i = 0, sum = 0; i < token_count; i++) {
                    sum += scoreObject(tokens[i], data);
                }
                return sum / token_count;
            };
        }
    };
    Sifter.prototype.getSortFunction = function (search, options) {
        var i, n, self, field, fields, fields_count, multiplier, multipliers, get_field, implicit_score, sort;
        self = this;
        search = self.prepareSearch(search, options);
        sort = (!search.query && options.sort_empty) || options.sort;
        get_field = function (name, result) {
            if (name === '$score') return result.score;
            return getattr(self.items[result.id], name, options.nesting);
        };
        fields = [];
        if (sort) {
            for (i = 0, n = sort.length; i < n; i++) {
                if (search.query || sort[i].field !== '$score') {
                    fields.push(sort[i]);
                }
            }
        }
        if (search.query) {
            implicit_score = true;
            for (i = 0, n = fields.length; i < n; i++) {
                if (fields[i].field === '$score') {
                    implicit_score = false;
                    break;
                }
            }
            if (implicit_score) {
                fields.unshift({
                    field: '$score',
                    direction: 'desc'
                });
            }
        } else {
            for (i = 0, n = fields.length; i < n; i++) {
                if (fields[i].field === '$score') {
                    fields.splice(i, 1);
                    break;
                }
            }
        }
        multipliers = [];
        for (i = 0, n = fields.length; i < n; i++) {
            multipliers.push(fields[i].direction === 'desc' ? -1 : 1);
        }
        fields_count = fields.length;
        if (!fields_count) {
            return null;
        } else if (fields_count === 1) {
            field = fields[0].field;
            multiplier = multipliers[0];
            return function (a, b) {
                return multiplier * cmp(get_field(field, a), get_field(field, b));
            };
        } else {
            return function (a, b) {
                var i, result, a_value, b_value, field;
                for (i = 0; i < fields_count; i++) {
                    field = fields[i].field;
                    result = multipliers[i] * cmp(get_field(field, a), get_field(field, b));
                    if (result) return result;
                }
                return 0;
            };
        }
    };
    Sifter.prototype.prepareSearch = function (query, options) {
        if (typeof query === 'object') return query;
        options = extend({}, options);
        var option_fields = options.fields;
        var option_sort = options.sort;
        var option_sort_empty = options.sort_empty;
        if (option_fields && !is_array(option_fields)) options.fields = [option_fields];
        if (option_sort && !is_array(option_sort)) options.sort = [option_sort];
        if (option_sort_empty && !is_array(option_sort_empty)) options.sort_empty = [option_sort_empty];
        return {
            options: options,
            query: String(query || '').toLowerCase(),
            tokens: this.tokenize(query),
            total: 0,
            items: []
        };
    };
    Sifter.prototype.search = function (query, options) {
        var self = this,
            value, score, search, calculateScore;
        var fn_sort;
        var fn_score;
        search = this.prepareSearch(query, options);
        options = search.options;
        query = search.query;
        fn_score = options.score || self.getScoreFunction(search);
        if (query.length) {
            self.iterator(self.items, function (item, id) {
                score = fn_score(item);
                if (options.filter === false || score > 0) {
                    search.items.push({
                        'score': score,
                        'id': id
                    });
                }
            });
        } else {
            self.iterator(self.items, function (item, id) {
                search.items.push({
                    'score': 1,
                    'id': id
                });
            });
        }
        fn_sort = self.getSortFunction(search, options);
        if (fn_sort) search.items.sort(fn_sort);
        search.total = search.items.length;
        if (typeof options.limit === 'number') {
            search.items = search.items.slice(0, options.limit);
        }
        return search;
    };
    var cmp = function (a, b) {
        if (typeof a === 'number' && typeof b === 'number') {
            return a > b ? 1 : (a < b ? -1 : 0);
        }
        a = asciifold(String(a || ''));
        b = asciifold(String(b || ''));
        if (a > b) return 1;
        if (b > a) return -1;
        return 0;
    };
    var extend = function (a, b) {
        var i, n, k, object;
        for (i = 1, n = arguments.length; i < n; i++) {
            object = arguments[i];
            if (!object) continue;
            for (k in object) {
                if (object.hasOwnProperty(k)) {
                    a[k] = object[k];
                }
            }
        }
        return a;
    };
    var getattr = function (obj, name, nesting) {
        if (!obj || !name) return;
        if (!nesting) return obj[name];
        var names = name.split(".");
        while (names.length && (obj = obj[names.shift()]));
        return obj;
    };
    var trim = function (str) {
        return (str + '').replace(/^\s+|\s+$|/g, '');
    };
    var escape_regex = function (str) {
        return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    };
    var is_array = Array.isArray || (typeof $ !== 'undefined' && $.isArray) || function (object) {
        return Object.prototype.toString.call(object) === '[object Array]';
    };
    var DIACRITICS = {
        'a': '[aḀḁĂăÂâǍǎȺⱥȦȧẠạÄäÀàÁáĀāÃãÅåąĄÃąĄ]',
        'b': '[b␢βΒB฿𐌁ᛒ]',
        'c': '[cĆćĈĉČčĊċC̄c̄ÇçḈḉȻȼƇƈɕᴄＣｃ]',
        'd': '[dĎďḊḋḐḑḌḍḒḓḎḏĐđD̦d̦ƉɖƊɗƋƌᵭᶁᶑȡᴅＤｄð]',
        'e': '[eÉéÈèÊêḘḙĚěĔĕẼẽḚḛẺẻĖėËëĒēȨȩĘęᶒɆɇȄȅẾếỀềỄễỂểḜḝḖḗḔḕȆȇẸẹỆệⱸᴇＥｅɘǝƏƐε]',
        'f': '[fƑƒḞḟ]',
        'g': '[gɢ₲ǤǥĜĝĞğĢģƓɠĠġ]',
        'h': '[hĤĥĦħḨḩẖẖḤḥḢḣɦʰǶƕ]',
        'i': '[iÍíÌìĬĭÎîǏǐÏïḮḯĨĩĮįĪīỈỉȈȉȊȋỊịḬḭƗɨɨ̆ᵻᶖİiIıɪＩｉ]',
        'j': '[jȷĴĵɈɉʝɟʲ]',
        'k': '[kƘƙꝀꝁḰḱǨǩḲḳḴḵκϰ₭]',
        'l': '[lŁłĽľĻļĹĺḶḷḸḹḼḽḺḻĿŀȽƚⱠⱡⱢɫɬᶅɭȴʟＬｌ]',
        'n': '[nŃńǸǹŇňÑñṄṅŅņṆṇṊṋṈṉN̈n̈ƝɲȠƞᵰᶇɳȵɴＮｎŊŋ]',
        'o': '[oØøÖöÓóÒòÔôǑǒŐőŎŏȮȯỌọƟɵƠơỎỏŌōÕõǪǫȌȍՕօ]',
        'p': '[pṔṕṖṗⱣᵽƤƥᵱ]',
        'q': '[qꝖꝗʠɊɋꝘꝙq̃]',
        'r': '[rŔŕɌɍŘřŖŗṘṙȐȑȒȓṚṛⱤɽ]',
        's': '[sŚśṠṡṢṣꞨꞩŜŝŠšŞşȘșS̈s̈]',
        't': '[tŤťṪṫŢţṬṭƮʈȚțṰṱṮṯƬƭ]',
        'u': '[uŬŭɄʉỤụÜüÚúÙùÛûǓǔŰűŬŭƯưỦủŪūŨũŲųȔȕ∪]',
        'v': '[vṼṽṾṿƲʋꝞꝟⱱʋ]',
        'w': '[wẂẃẀẁŴŵẄẅẆẇẈẉ]',
        'x': '[xẌẍẊẋχ]',
        'y': '[yÝýỲỳŶŷŸÿỸỹẎẏỴỵɎɏƳƴ]',
        'z': '[zŹźẐẑŽžŻżẒẓẔẕƵƶ]'
    };
    var asciifold = (function () {
        var i, n, k, chunk;
        var foreignletters = '';
        var lookup = {};
        for (k in DIACRITICS) {
            if (DIACRITICS.hasOwnProperty(k)) {
                chunk = DIACRITICS[k].substring(2, DIACRITICS[k].length - 1);
                foreignletters += chunk;
                for (i = 0, n = chunk.length; i < n; i++) {
                    lookup[chunk.charAt(i)] = k;
                }
            }
        }
        var regexp = new RegExp('[' + foreignletters + ']', 'g');
        return function (str) {
            return str.replace(regexp, function (foreignletter) {
                return lookup[foreignletter];
            }).toLowerCase();
        };
    })();
    return Sifter;
}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('microplugin', factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.MicroPlugin = factory();
    }
}(this, function () {
    var MicroPlugin = {};
    MicroPlugin.mixin = function (Interface) {
        Interface.plugins = {};
        Interface.prototype.initializePlugins = function (plugins) {
            var i, n, key;
            var self = this;
            var queue = [];
            self.plugins = {
                names: [],
                settings: {},
                requested: {},
                loaded: {}
            };
            if (utils.isArray(plugins)) {
                for (i = 0, n = plugins.length; i < n; i++) {
                    if (typeof plugins[i] === 'string') {
                        queue.push(plugins[i]);
                    } else {
                        self.plugins.settings[plugins[i].name] = plugins[i].options;
                        queue.push(plugins[i].name);
                    }
                }
            } else if (plugins) {
                for (key in plugins) {
                    if (plugins.hasOwnProperty(key)) {
                        self.plugins.settings[key] = plugins[key];
                        queue.push(key);
                    }
                }
            }
            while (queue.length) {
                self.require(queue.shift());
            }
        };
        Interface.prototype.loadPlugin = function (name) {
            var self = this;
            var plugins = self.plugins;
            var plugin = Interface.plugins[name];
            if (!Interface.plugins.hasOwnProperty(name)) {
                throw new Error('Unable to find "' + name + '" plugin');
            }
            plugins.requested[name] = true;
            plugins.loaded[name] = plugin.fn.apply(self, [self.plugins.settings[name] || {}]);
            plugins.names.push(name);
        };
        Interface.prototype.require = function (name) {
            var self = this;
            var plugins = self.plugins;
            if (!self.plugins.loaded.hasOwnProperty(name)) {
                if (plugins.requested[name]) {
                    throw new Error('Plugin has circular dependency ("' + name + '")');
                }
                self.loadPlugin(name);
            }
            return plugins.loaded[name];
        };
        Interface.define = function (name, fn) {
            Interface.plugins[name] = {
                'name': name,
                'fn': fn
            };
        };
    };
    var utils = {
        isArray: Array.isArray || function (vArg) {
            return Object.prototype.toString.call(vArg) === '[object Array]';
        }
    };
    return MicroPlugin;
}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('selectize', ['jquery', 'sifter', 'microplugin'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('jquery'), require('sifter'), require('microplugin'));
    } else {
        root.Selectize = factory(root.jQuery, root.Sifter, root.MicroPlugin);
    }
}(this, function ($, Sifter, MicroPlugin) {
    'use strict';
    var highlight = function ($element, pattern) {
        if (typeof pattern === 'string' && !pattern.length) return;
        var regex = (typeof pattern === 'string') ? new RegExp(pattern, 'i') : pattern;
        var highlight = function (node) {
            var skip = 0;
            if (node.nodeType === 3) {
                var pos = node.data.search(regex);
                if (pos >= 0 && node.data.length > 0) {
                    var match = node.data.match(regex);
                    var spannode = document.createElement('span');
                    spannode.className = 'highlight';
                    var middlebit = node.splitText(pos);
                    var endbit = middlebit.splitText(match[0].length);
                    var middleclone = middlebit.cloneNode(true);
                    spannode.appendChild(middleclone);
                    middlebit.parentNode.replaceChild(spannode, middlebit);
                    skip = 1;
                }
            } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
                for (var i = 0; i < node.childNodes.length; ++i) {
                    i += highlight(node.childNodes[i]);
                }
            }
            return skip;
        };
        return $element.each(function () {
            highlight(this);
        });
    };
    $.fn.removeHighlight = function () {
        return this.find("span.highlight").each(function () {
            this.parentNode.firstChild.nodeName;
            var parent = this.parentNode;
            parent.replaceChild(this.firstChild, this);
            parent.normalize();
        }).end();
    };
    var MicroEvent = function () {};
    MicroEvent.prototype = {
        on: function (event, fct) {
            this._events = this._events || {};
            this._events[event] = this._events[event] || [];
            this._events[event].push(fct);
        },
        off: function (event, fct) {
            var n = arguments.length;
            if (n === 0) return delete this._events;
            if (n === 1) return delete this._events[event];
            this._events = this._events || {};
            if (event in this._events === false) return;
            this._events[event].splice(this._events[event].indexOf(fct), 1);
        },
        trigger: function (event) {
            this._events = this._events || {};
            if (event in this._events === false) return;
            for (var i = 0; i < this._events[event].length; i++) {
                this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }
    };
    MicroEvent.mixin = function (destObject) {
        var props = ['on', 'off', 'trigger'];
        for (var i = 0; i < props.length; i++) {
            destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
        }
    };
    var IS_MAC = /Mac/.test(navigator.userAgent);
    var KEY_A = 65;
    var KEY_COMMA = 188;
    var KEY_RETURN = 13;
    var KEY_ESC = 27;
    var KEY_LEFT = 37;
    var KEY_UP = 38;
    var KEY_P = 80;
    var KEY_RIGHT = 39;
    var KEY_DOWN = 40;
    var KEY_N = 78;
    var KEY_BACKSPACE = 8;
    var KEY_DELETE = 46;
    var KEY_SHIFT = 16;
    var KEY_CMD = IS_MAC ? 91 : 17;
    var KEY_CTRL = IS_MAC ? 18 : 17;
    var KEY_TAB = 9;
    var TAG_SELECT = 1;
    var TAG_INPUT = 2;
    var SUPPORTS_VALIDITY_API = !/android/i.test(window.navigator.userAgent) && !!document.createElement('input').validity;
    var isset = function (object) {
        return typeof object !== 'undefined';
    };
    var hash_key = function (value) {
        if (typeof value === 'undefined' || value === null) return null;
        if (typeof value === 'boolean') return value ? '1' : '0';
        return value + '';
    };
    var escape_html = function (str) {
        return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };
    var escape_replace = function (str) {
        return (str + '').replace(/\$/g, '$$$$');
    };
    var hook = {};
    hook.before = function (self, method, fn) {
        var original = self[method];
        self[method] = function () {
            fn.apply(self, arguments);
            return original.apply(self, arguments);
        };
    };
    hook.after = function (self, method, fn) {
        var original = self[method];
        self[method] = function () {
            var result = original.apply(self, arguments);
            fn.apply(self, arguments);
            return result;
        };
    };
    var once = function (fn) {
        var called = false;
        return function () {
            if (called) return;
            called = true;
            fn.apply(this, arguments);
        };
    };
    var debounce = function (fn, delay) {
        var timeout;
        return function () {
            var self = this;
            var args = arguments;
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                fn.apply(self, args);
            }, delay);
        };
    };
    var debounce_events = function (self, types, fn) {
        var type;
        var trigger = self.trigger;
        var event_args = {};
        self.trigger = function () {
            var type = arguments[0];
            if (types.indexOf(type) !== -1) {
                event_args[type] = arguments;
            } else {
                return trigger.apply(self, arguments);
            }
        };
        fn.apply(self, []);
        self.trigger = trigger;
        for (type in event_args) {
            if (event_args.hasOwnProperty(type)) {
                trigger.apply(self, event_args[type]);
            }
        }
    };
    var watchChildEvent = function ($parent, event, selector, fn) {
        $parent.on(event, selector, function (e) {
            var child = e.target;
            while (child && child.parentNode !== $parent[0]) {
                child = child.parentNode;
            }
            e.currentTarget = child;
            return fn.apply(this, [e]);
        });
    };
    var getSelection = function (input) {
        var result = {};
        if ('selectionStart' in input) {
            result.start = input.selectionStart;
            result.length = input.selectionEnd - result.start;
        } else if (document.selection) {
            input.focus();
            var sel = document.selection.createRange();
            var selLen = document.selection.createRange().text.length;
            sel.moveStart('character', -input.value.length);
            result.start = sel.text.length - selLen;
            result.length = selLen;
        }
        return result;
    };
    var transferStyles = function ($from, $to, properties) {
        var i, n, styles = {};
        if (properties) {
            for (i = 0, n = properties.length; i < n; i++) {
                styles[properties[i]] = $from.css(properties[i]);
            }
        } else {
            styles = $from.css();
        }
        $to.css(styles);
    };
    var measureString = function (str, $parent) {
        if (!str) {
            return 0;
        }
        var $test = $('<test>').css({
            position: 'absolute',
            top: -99999,
            left: -99999,
            width: 'auto',
            padding: 0,
            whiteSpace: 'pre'
        }).text(str).appendTo('body');
        transferStyles($parent, $test, ['letterSpacing', 'fontSize', 'fontFamily', 'fontWeight', 'textTransform']);
        var width = $test.width();
        $test.remove();
        return width;
    };
    var autoGrow = function ($input) {
        var currentWidth = null;
        var update = function (e, options) {
            var value, keyCode, printable, placeholder, width;
            var shift, character, selection;
            e = e || window.event || {};
            options = options || {};
            if (e.metaKey || e.altKey) return;
            if (!options.force && $input.data('grow') === false) return;
            value = $input.val();
            if (e.type && e.type.toLowerCase() === 'keydown') {
                keyCode = e.keyCode;
                printable = ((keyCode >= 97 && keyCode <= 122) || (keyCode >= 65 && keyCode <= 90) || (keyCode >= 48 && keyCode <= 57) || keyCode === 32);
                if (keyCode === KEY_DELETE || keyCode === KEY_BACKSPACE) {
                    selection = getSelection($input[0]);
                    if (selection.length) {
                        value = value.substring(0, selection.start) + value.substring(selection.start + selection.length);
                    } else if (keyCode === KEY_BACKSPACE && selection.start) {
                        value = value.substring(0, selection.start - 1) + value.substring(selection.start + 1);
                    } else if (keyCode === KEY_DELETE && typeof selection.start !== 'undefined') {
                        value = value.substring(0, selection.start) + value.substring(selection.start + 1);
                    }
                } else if (printable) {
                    shift = e.shiftKey;
                    character = String.fromCharCode(e.keyCode);
                    if (shift) character = character.toUpperCase();
                    else character = character.toLowerCase();
                    value += character;
                }
            }
            placeholder = $input.attr('placeholder');
            if (!value && placeholder) {
                value = placeholder;
            }
            width = measureString(value, $input) + 4;
            if (width !== currentWidth) {
                currentWidth = width;
                $input.style('width', 500 + 'px', 'important');
                $input.triggerHandler('resize');
            }
        };
        $input.on('keydown keyup update blur', update);
        update();
    };
    var domToString = function (d) {
        var tmp = document.createElement('div');
        tmp.appendChild(d.cloneNode(true));
        return tmp.innerHTML;
    };
    var logError = function (message, options) {
        if (!options) options = {};
        var component = "Selectize";
        console.error(component + ": " + message)
        if (options.explanation) {
            if (console.group) console.group();
            console.error(options.explanation);
            if (console.group) console.groupEnd();
        }
    }
    var Selectize = function ($input, settings) {
        var key, i, n, dir, input, self = this;
        input = $input[0];
        input.selectize = self;
        var computedStyle = window.getComputedStyle && window.getComputedStyle(input, null);
        dir = computedStyle ? computedStyle.getPropertyValue('direction') : input.currentStyle && input.currentStyle.direction;
        dir = dir || $input.parents('[dir]:first').attr('dir') || '';
        $.extend(self, {
            order: 0,
            settings: settings,
            $input: $input,
            tabIndex: $input.attr('tabindex') || '',
            tagType: input.tagName.toLowerCase() === 'select' ? TAG_SELECT : TAG_INPUT,
            rtl: /rtl/i.test(dir),
            eventNS: '.selectize' + (++Selectize.count),
            highlightedValue: null,
            isOpen: false,
            isDisabled: false,
            isRequired: $input.is('[required]'),
            isInvalid: false,
            isLocked: false,
            isFocused: false,
            isInputHidden: false,
            isSetup: false,
            isShiftDown: false,
            isCmdDown: false,
            isCtrlDown: false,
            ignoreFocus: false,
            ignoreBlur: false,
            ignoreHover: false,
            hasOptions: false,
            currentResults: null,
            lastValue: '',
            caretPos: 0,
            loading: 0,
            loadedSearches: {},
            $activeOption: null,
            $activeItems: [],
            optgroups: {},
            options: {},
            userOptions: {},
            items: [],
            renderCache: {},
            onSearchChange: settings.loadThrottle === null ? self.onSearchChange : debounce(self.onSearchChange, settings.loadThrottle)
        });
        self.sifter = new Sifter(this.options, {
            diacritics: settings.diacritics
        });
        if (self.settings.options) {
            for (i = 0, n = self.settings.options.length; i < n; i++) {
                self.registerOption(self.settings.options[i]);
            }
            delete self.settings.options;
        }
        if (self.settings.optgroups) {
            for (i = 0, n = self.settings.optgroups.length; i < n; i++) {
                self.registerOptionGroup(self.settings.optgroups[i]);
            }
            delete self.settings.optgroups;
        }
        self.settings.mode = self.settings.mode || (self.settings.maxItems === 1 ? 'single' : 'multi');
        if (typeof self.settings.hideSelected !== 'boolean') {
            self.settings.hideSelected = self.settings.mode === 'multi';
        }
        self.initializePlugins(self.settings.plugins);
        self.setupCallbacks();
        self.setupTemplates();
        self.setup();
    };
    MicroEvent.mixin(Selectize);
    if (typeof MicroPlugin !== "undefined") {
        MicroPlugin.mixin(Selectize);
    } else {
        logError("Dependency MicroPlugin is missing", {
            explanation: "Make sure you either: (1) are using the \"standalone\" " +
                "version of Selectize, or (2) require MicroPlugin before you " +
                "load Selectize."
        });
    }
    $.extend(Selectize.prototype, {
        setup: function () {
            var self = this;
            var settings = self.settings;
            var eventNS = self.eventNS;
            var $window = $(window);
            var $document = $(document);
            var $input = self.$input;
            var $wrapper;
            var $control;
            var $control_input;
            var $dropdown;
            var $dropdown_content;
            var $dropdown_parent;
            var inputMode;
            var timeout_blur;
            var timeout_focus;
            var classes;
            var classes_plugins;
            var inputId;
            inputMode = self.settings.mode;
            classes = $input.attr('class') || '';
            $wrapper = $('<div>').addClass(settings.wrapperClass).addClass(classes).addClass(inputMode);
            $control = $('<div>').addClass(settings.inputClass).addClass('items').appendTo($wrapper);
            $control_input = $('<input type="text" class="selectize-input-text" autocomplete="off" />').appendTo($control).attr('tabindex', $input.is(':disabled') ? '-1' : self.tabIndex);
            $dropdown_parent = $(settings.dropdownParent || $wrapper);
            $dropdown = $('<div>').addClass(settings.dropdownClass).addClass(inputMode).hide().appendTo($dropdown_parent);
            $dropdown_content = $('<div>').addClass(settings.dropdownContentClass).appendTo($dropdown);
            if (inputId = $input.attr('id')) {
                $control_input.attr('id', inputId + '-selectized');
                $("label[for='" + inputId + "']").attr('for', inputId + '-selectized');
            }
            if (self.settings.copyClassesToDropdown) {
                $dropdown.addClass(classes);
            }
            $wrapper.css({
                width: $input[0].style.width
            });
            if (self.plugins.names.length) {
                classes_plugins = 'plugin-' + self.plugins.names.join(' plugin-');
                $wrapper.addClass(classes_plugins);
                $dropdown.addClass(classes_plugins);
            }
            if ((settings.maxItems === null || settings.maxItems > 1) && self.tagType === TAG_SELECT) {
                $input.attr('multiple', 'multiple');
            }
            if (self.settings.placeholder) {
                $control_input.attr('placeholder', settings.placeholder);
            }
            if (!self.settings.splitOn && self.settings.delimiter) {
                var delimiterEscaped = self.settings.delimiter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                self.settings.splitOn = new RegExp('\\s*' + delimiterEscaped + '+\\s*');
            }
            if ($input.attr('autocorrect')) {
                $control_input.attr('autocorrect', $input.attr('autocorrect'));
            }
            if ($input.attr('autocapitalize')) {
                $control_input.attr('autocapitalize', $input.attr('autocapitalize'));
            }
            self.$wrapper = $wrapper;
            self.$control = $control;
            self.$control_input = $control_input;
            self.$dropdown = $dropdown;
            self.$dropdown_content = $dropdown_content;
            $dropdown.on('mouseenter', '[data-selectable]', function () {
                return self.onOptionHover.apply(self, arguments);
            });
            $dropdown.on('mousedown click', '[data-selectable]', function () {
                return self.onOptionSelect.apply(self, arguments);
            });
            watchChildEvent($control, 'mousedown', '*:not(input)', function () {
                return self.onItemSelect.apply(self, arguments);
            });
            autoGrow($control_input);
            $control.on({
                mousedown: function () {
                    return self.onMouseDown.apply(self, arguments);
                },
                click: function () {
                    return self.onClick.apply(self, arguments);
                }
            });
            $control_input.on({
                mousedown: function (e) {
                    e.stopPropagation();
                },
                keydown: function () {
                    return self.onKeyDown.apply(self, arguments);
                },
                keyup: function () {
                    return self.onKeyUp.apply(self, arguments);
                },
                keypress: function () {
                    return self.onKeyPress.apply(self, arguments);
                },
                resize: function () {
                    self.positionDropdown.apply(self, []);
                },
                blur: function () {
                    return self.onBlur.apply(self, arguments);
                },
                focus: function () {
                    self.ignoreBlur = false;
                    return self.onFocus.apply(self, arguments);
                },
                paste: function () {
                    return self.onPaste.apply(self, arguments);
                }
            });
            $document.on('keydown' + eventNS, function (e) {
                self.isCmdDown = e[IS_MAC ? 'metaKey' : 'ctrlKey'];
                self.isCtrlDown = e[IS_MAC ? 'altKey' : 'ctrlKey'];
                self.isShiftDown = e.shiftKey;
            });
            $document.on('keyup' + eventNS, function (e) {
                if (e.keyCode === KEY_CTRL) self.isCtrlDown = false;
                if (e.keyCode === KEY_SHIFT) self.isShiftDown = false;
                if (e.keyCode === KEY_CMD) self.isCmdDown = false;
            });
            $document.on('mousedown' + eventNS, function (e) {
                if (self.isFocused) {
                    if (e.target === self.$dropdown[0] || e.target.parentNode === self.$dropdown[0]) {
                        return false;
                    }
                    if (!self.$control.has(e.target).length && e.target !== self.$control[0]) {
                        self.blur(e.target);
                    }
                }
            });
            $window.on(['scroll' + eventNS, 'resize' + eventNS].join(' '), function () {
                if (self.isOpen) {
                    self.positionDropdown.apply(self, arguments);
                }
            });
            $window.on('mousemove' + eventNS, function () {
                self.ignoreHover = false;
            });
            this.revertSettings = {
                $children: $input.children().detach(),
                tabindex: $input.attr('tabindex')
            };
            $input.attr('tabindex', -1).hide().after(self.$wrapper);
            if ($.isArray(settings.items)) {
                self.setValue(settings.items);
                delete settings.items;
            }
            if (SUPPORTS_VALIDITY_API) {
                $input.on('invalid' + eventNS, function (e) {
                    e.preventDefault();
                    self.isInvalid = true;
                    self.refreshState();
                });
            }
            self.updateOriginalInput();
            self.refreshItems();
            self.refreshState();
            self.updatePlaceholder();
            self.isSetup = true;
            if ($input.is(':disabled')) {
                self.disable();
            }
            self.on('change', this.onChange);
            $input.data('selectize', self);
            $input.addClass('selectized');
            self.trigger('initialize');
            if (settings.preload === true) {
                self.onSearchChange('');
            }
        },
        setupTemplates: function () {
            var self = this;
            var field_label = self.settings.labelField;
            var field_optgroup = self.settings.optgroupLabelField;
            var templates = {
                'optgroup': function (data) {
                    return '<div class="optgroup">' + data.html + '</div>';
                },
                'optgroup_header': function (data, escape) {
                    return '<div class="optgroup-header">' + escape(data[field_optgroup]) + '</div>';
                },
                'option': function (data, escape) {
                    return '<div class="option">' + escape(data[field_label]) + '</div>';
                },
                'item': function (data, escape) {
                    return '<div class="item">' + escape(data[field_label]) + '</div>';
                },
                'option_create': function (data, escape) {
                    return '<div class="create">Add <strong>' + escape(data.input) + '</strong>&hellip;</div>';
                }
            };
            self.settings.render = $.extend({}, templates, self.settings.render);
        },
        setupCallbacks: function () {
            var key, fn, callbacks = {
                'initialize': 'onInitialize',
                'change': 'onChange',
                'item_add': 'onItemAdd',
                'item_remove': 'onItemRemove',
                'clear': 'onClear',
                'option_add': 'onOptionAdd',
                'option_remove': 'onOptionRemove',
                'option_clear': 'onOptionClear',
                'optgroup_add': 'onOptionGroupAdd',
                'optgroup_remove': 'onOptionGroupRemove',
                'optgroup_clear': 'onOptionGroupClear',
                'dropdown_open': 'onDropdownOpen',
                'dropdown_close': 'onDropdownClose',
                'type': 'onType',
                'load': 'onLoad',
                'focus': 'onFocus',
                'blur': 'onBlur'
            };
            for (key in callbacks) {
                if (callbacks.hasOwnProperty(key)) {
                    fn = this.settings[callbacks[key]];
                    if (fn) this.on(key, fn);
                }
            }
        },
        onClick: function (e) {
            var self = this;
            if (!self.isFocused) {
                self.focus();
                e.preventDefault();
            }
        },
        onMouseDown: function (e) {
            var self = this;
            var defaultPrevented = e.isDefaultPrevented();
            var $target = $(e.target);
            if (self.isFocused) {
                if (e.target !== self.$control_input[0]) {
                    if (self.settings.mode === 'single') {
                        self.isOpen ? self.close() : self.open();
                    } else if (!defaultPrevented) {
                        self.setActiveItem(null);
                    }
                    return false;
                }
            } else {
                if (!defaultPrevented) {
                    window.setTimeout(function () {
                        self.focus();
                    }, 0);
                }
            }
        },
        onChange: function () {
            this.$input.trigger('change');
        },
        onPaste: function (e) {
            var self = this;
            if (self.isFull() || self.isInputHidden || self.isLocked) {
                e.preventDefault();
                return;
            }
            if (self.settings.splitOn) {
                setTimeout(function () {
                    var pastedText = self.$control_input.val();
                    if (!pastedText.match(self.settings.splitOn)) {
                        return
                    }
                    var splitInput = $.trim(pastedText).split(self.settings.splitOn);
                    for (var i = 0, n = splitInput.length; i < n; i++) {
                        self.createItem(splitInput[i]);
                    }
                }, 0);
            }
        },
        onKeyPress: function (e) {
            if (this.isLocked) return e && e.preventDefault();
            var character = String.fromCharCode(e.keyCode || e.which);
            if (this.settings.create && this.settings.mode === 'multi' && character === this.settings.delimiter) {
                this.createItem();
                e.preventDefault();
                return false;
            }
        },
        onKeyDown: function (e) {
            var isInput = e.target === this.$control_input[0];
            var self = this;
            if (self.isLocked) {
                if (e.keyCode !== KEY_TAB) {
                    e.preventDefault();
                }
                return;
            }
            switch (e.keyCode) {
                case KEY_A:
                    if (self.isCmdDown) {
                        self.selectAll();
                        return;
                    }
                    break;
                case KEY_ESC:
                    if (self.isOpen) {
                        e.preventDefault();
                        e.stopPropagation();
                        self.close();
                    }
                    return;
                case KEY_N:
                    if (!e.ctrlKey || e.altKey) break;
                case KEY_DOWN:
                    if (!self.isOpen && self.hasOptions) {
                        self.open();
                    } else if (self.$activeOption) {
                        self.ignoreHover = true;
                        var $next = self.getAdjacentOption(self.$activeOption, 1);
                        if ($next.length) self.setActiveOption($next, true, true);
                    }
                    e.preventDefault();
                    return;
                case KEY_P:
                    if (!e.ctrlKey || e.altKey) break;
                case KEY_UP:
                    if (self.$activeOption) {
                        self.ignoreHover = true;
                        var $prev = self.getAdjacentOption(self.$activeOption, -1);
                        if ($prev.length) self.setActiveOption($prev, true, true);
                    }
                    e.preventDefault();
                    return;
                case KEY_RETURN:
                    if (self.isOpen && self.$activeOption) {
                        self.onOptionSelect({
                            currentTarget: self.$activeOption
                        });
                        e.preventDefault();
                    }
                    return;
                case KEY_LEFT:
                    self.advanceSelection(-1, e);
                    return;
                case KEY_RIGHT:
                    self.advanceSelection(1, e);
                    return;
                case KEY_TAB:
                    if (self.settings.selectOnTab && self.isOpen && self.$activeOption) {
                        self.onOptionSelect({
                            currentTarget: self.$activeOption
                        });
                        if (!self.isFull()) {
                            e.preventDefault();
                        }
                    }
                    if (self.settings.create && self.createItem()) {
                        e.preventDefault();
                    }
                    return;
                case KEY_BACKSPACE:
                case KEY_DELETE:
                    self.deleteSelection(e);
                    return;
            }
            if ((self.isFull() || self.isInputHidden) && !(IS_MAC ? e.metaKey : e.ctrlKey)) {
                e.preventDefault();
                return;
            }
        },
        onKeyUp: function (e) {
            var self = this;
            if (self.isLocked) return e && e.preventDefault();
            var value = self.$control_input.val() || '';
            if (self.lastValue !== value) {
                self.lastValue = value;
                self.onSearchChange(value);
                self.refreshOptions();
                self.trigger('type', value);
            }
        },
        onSearchChange: function (value) {
            var self = this;
            var fn = self.settings.load;
            if (!fn) return;
            if (self.loadedSearches.hasOwnProperty(value)) return;
            self.loadedSearches[value] = true;
            self.load(function (callback) {
                fn.apply(self, [value, callback]);
            });
        },
        onFocus: function (e) {
            var self = this;
            var wasFocused = self.isFocused;
            if (self.isDisabled) {
                self.blur();
                e && e.preventDefault();
                return false;
            }
            if (self.ignoreFocus) return;
            self.isFocused = true;
            if (self.settings.preload === 'focus') self.onSearchChange('');
            if (!wasFocused) self.trigger('focus');
            if (!self.$activeItems.length) {
                self.showInput();
                self.setActiveItem(null);
                self.refreshOptions(!!self.settings.openOnFocus);
            }
            self.refreshState();
        },
        onBlur: function (e, dest) {
            var self = this;
            if (!self.isFocused) return;
            self.isFocused = false;
            if (self.ignoreFocus) {
                return;
            } else if (!self.ignoreBlur && document.activeElement === self.$dropdown_content[0]) {
                self.ignoreBlur = true;
                self.onFocus(e);
                return;
            }
            var deactivate = function () {
                self.close();
                self.setTextboxValue('');
                self.setActiveItem(null);
                self.setActiveOption(null);
                self.setCaret(self.items.length);
                self.refreshState();
                dest && dest.focus && dest.focus();
                self.ignoreFocus = false;
                self.trigger('blur');
            };
            self.ignoreFocus = true;
            if (self.settings.create && self.settings.createOnBlur) {
                self.createItem(null, false, deactivate);
            } else {
                deactivate();
            }
        },
        onOptionHover: function (e) {
            if (this.ignoreHover) return;
            this.setActiveOption(e.currentTarget, false);
        },
        onOptionSelect: function (e) {
            var value, $target, $option, self = this;
            if (e.preventDefault) {
                e.preventDefault();
                e.stopPropagation();
            }
            $target = $(e.currentTarget);
            value = $target.attr('data-value');
            var option = self.getOption(value);
            if ($(e.target).hasClass('remove') || $(e.target).parent().hasClass('remove')) {
                remove_wallet(self, value);
            }
            if (option.data('value') === 'button') {
                show_add_wallet(self);
                return;
            }
            if ($target.hasClass('create')) {
                self.createItem(null, function () {
                    if (self.settings.closeAfterSelect) {
                        self.close();
                    }
                });
            } else {
                value = $target.attr('data-value');
                if (typeof value !== 'undefined') {
                    self.lastQuery = null;
                    self.setTextboxValue('');
                    self.addItem(value);
                    if (self.settings.closeAfterSelect) {
                        self.close();
                    } else if (!self.settings.hideSelected && e.type && /mouse/.test(e.type)) {
                        self.setActiveOption(self.getOption(value));
                    }
                }
            }
        },
        onItemSelect: function (e) {
            var self = this;
            if (self.isLocked) return;
            if (self.settings.mode === 'multi') {
                e.preventDefault();
                self.setActiveItem(e.currentTarget, e);
            }
        },
        load: function (fn) {
            var self = this;
            var $wrapper = self.$wrapper.addClass(self.settings.loadingClass);
            self.loading++;
            fn.apply(self, [function (results) {
                self.loading = Math.max(self.loading - 1, 0);
                if (results && results.length) {
                    self.addOption(results);
                    self.refreshOptions(self.isFocused && !self.isInputHidden);
                }
                if (!self.loading) {
                    $wrapper.removeClass(self.settings.loadingClass);
                }
                self.trigger('load', results);
            }]);
        },
        setTextboxValue: function (value) {
            var $input = this.$control_input;
            var changed = $input.val() !== value;
            if (changed) {
                $input.val(value).triggerHandler('update');
                this.lastValue = value;
            }
        },
        getValue: function () {
            if (this.tagType === TAG_SELECT && this.$input.attr('multiple')) {
                return this.items;
            } else {
                return this.items.join(this.settings.delimiter);
            }
        },
        setValue: function (value, silent) {
            var events = silent ? [] : ['change'];
            debounce_events(this, events, function () {
                this.clear(silent);
                this.addItems(value, silent);
            });
        },
        setActiveItem: function ($item, e) {
            var self = this;
            var eventName;
            var i, idx, begin, end, item, swap;
            var $last;
            if (self.settings.mode === 'single') return;
            $item = $($item);
            if (!$item.length) {
                $(self.$activeItems).removeClass('active');
                self.$activeItems = [];
                if (self.isFocused) {
                    self.showInput();
                }
                return;
            }
            eventName = e && e.type.toLowerCase();
            if (eventName === 'mousedown' && self.isShiftDown && self.$activeItems.length) {
                $last = self.$control.children('.active:last');
                begin = Array.prototype.indexOf.apply(self.$control[0].childNodes, [$last[0]]);
                end = Array.prototype.indexOf.apply(self.$control[0].childNodes, [$item[0]]);
                if (begin > end) {
                    swap = begin;
                    begin = end;
                    end = swap;
                }
                for (i = begin; i <= end; i++) {
                    item = self.$control[0].childNodes[i];
                    if (self.$activeItems.indexOf(item) === -1) {
                        $(item).addClass('active');
                        self.$activeItems.push(item);
                    }
                }
                e.preventDefault();
            } else if ((eventName === 'mousedown' && self.isCtrlDown) || (eventName === 'keydown' && this.isShiftDown)) {
                if ($item.hasClass('active')) {
                    idx = self.$activeItems.indexOf($item[0]);
                    self.$activeItems.splice(idx, 1);
                    $item.removeClass('active');
                } else {
                    self.$activeItems.push($item.addClass('active')[0]);
                }
            } else {
                $(self.$activeItems).removeClass('active');
                self.$activeItems = [$item.addClass('active')[0]];
            }
            self.hideInput();
            if (!this.isFocused) {
                self.focus();
            }
        },
        setActiveOption: function ($option, scroll, animate) {
            var height_menu, height_item, y;
            var scroll_top, scroll_bottom;
            var self = this;
            if (self.$activeOption) self.$activeOption.removeClass('active');
            self.$activeOption = null;
            $option = $($option);
            if (!$option.length) return;
            self.$activeOption = $option.addClass('active');
            if (scroll || !isset(scroll)) {
                height_menu = self.$dropdown_content.height();
                height_item = self.$activeOption.outerHeight(true);
                scroll = self.$dropdown_content.scrollTop() || 0;
                y = self.$activeOption.offset().top - self.$dropdown_content.offset().top + scroll;
                scroll_top = y;
                scroll_bottom = y - height_menu + height_item;
                if (y + height_item > height_menu + scroll) {
                    self.$dropdown_content.stop().animate({
                        scrollTop: scroll_bottom
                    }, animate ? self.settings.scrollDuration : 0);
                } else if (y < scroll) {
                    self.$dropdown_content.stop().animate({
                        scrollTop: scroll_top
                    }, animate ? self.settings.scrollDuration : 0);
                }
            }
        },
        selectAll: function () {
            var self = this;
            if (self.settings.mode === 'single') return;
            self.$activeItems = Array.prototype.slice.apply(self.$control.children(':not(input)').addClass('active'));
            if (self.$activeItems.length) {
                self.hideInput();
                self.close();
            }
            self.focus();
        },
        hideInput: function () {
            var self = this;
            self.setTextboxValue('');
            self.$control_input.css({
                opacity: 0,
                position: 'absolute',
                left: self.rtl ? 10000 : -10000
            });
            self.isInputHidden = true;
        },
        showInput: function () {
            this.$control_input.css({
                opacity: 1,
                position: 'relative',
                left: 0
            });
            this.isInputHidden = false;
        },
        focus: function () {
            var self = this;
            if (self.isDisabled) return;
            self.ignoreFocus = true;
            self.$control_input[0].focus();
            window.setTimeout(function () {
                self.ignoreFocus = false;
                self.onFocus();
            }, 0);
        },
        blur: function (dest) {
            this.$control_input[0].blur();
            this.onBlur(null, dest);
        },
        getScoreFunction: function (query) {
            return this.sifter.getScoreFunction(query, this.getSearchOptions());
        },
        getSearchOptions: function () {
            var settings = this.settings;
            var sort = settings.sortField;
            if (typeof sort === 'string') {
                sort = [{
                    field: sort
                }];
            }
            return {
                fields: settings.searchField,
                conjunction: settings.searchConjunction,
                sort: sort
            };
        },
        search: function (query) {
            var i, value, score, result, calculateScore;
            var self = this;
            var settings = self.settings;
            var options = this.getSearchOptions();
            if (settings.score) {
                calculateScore = self.settings.score.apply(this, [query]);
                if (typeof calculateScore !== 'function') {
                    throw new Error('Selectize "score" setting must be a function that returns a function');
                }
            }
            if (query !== self.lastQuery) {
                self.lastQuery = query;
                result = self.sifter.search(query, $.extend(options, {
                    score: calculateScore
                }));
                self.currentResults = result;
            } else {
                result = $.extend(true, {}, self.currentResults);
            }
            if (settings.hideSelected) {
                for (i = result.items.length - 1; i >= 0; i--) {
                    if (self.items.indexOf(hash_key(result.items[i].id)) !== -1) {
                        result.items.splice(i, 1);
                    }
                }
            }
            return result;
        },
        refreshOptions: function (triggerDropdown) {
            var i, j, k, n, groups, groups_order, option, option_html, optgroup, optgroups, html, html_children, has_create_option;
            var $active, $active_before, $create;
            if (typeof triggerDropdown === 'undefined') {
                triggerDropdown = true;
            }
            var self = this;
            var query = $.trim(self.$control_input.val());
            var results = self.search(query);
            var $dropdown_content = self.$dropdown_content;
            var active_before = self.$activeOption && hash_key(self.$activeOption.attr('data-value'));
            n = results.items.length;
            if (typeof self.settings.maxOptions === 'number') {
                n = Math.min(n, self.settings.maxOptions);
            }
            groups = {};
            groups_order = [];
            for (i = 0; i < n; i++) {
                option = self.options[results.items[i].id];
                option_html = self.render('option', option);
                optgroup = option[self.settings.optgroupField] || '';
                optgroups = $.isArray(optgroup) ? optgroup : [optgroup];
                for (j = 0, k = optgroups && optgroups.length; j < k; j++) {
                    optgroup = optgroups[j];
                    if (!self.optgroups.hasOwnProperty(optgroup)) {
                        optgroup = '';
                    }
                    if (!groups.hasOwnProperty(optgroup)) {
                        groups[optgroup] = document.createDocumentFragment();
                        groups_order.push(optgroup);
                    }
                    groups[optgroup].appendChild(option_html);
                }
            }
            if (this.settings.lockOptgroupOrder) {
                groups_order.sort(function (a, b) {
                    var a_order = self.optgroups[a].$order || 0;
                    var b_order = self.optgroups[b].$order || 0;
                    return a_order - b_order;
                });
            }
            html = document.createDocumentFragment();
            for (i = 0, n = groups_order.length; i < n; i++) {
                optgroup = groups_order[i];
                if (self.optgroups.hasOwnProperty(optgroup) && groups[optgroup].childNodes.length) {
                    html_children = document.createDocumentFragment();
                    html_children.appendChild(self.render('optgroup_header', self.optgroups[optgroup]));
                    html_children.appendChild(groups[optgroup]);
                    html.appendChild(self.render('optgroup', $.extend({}, self.optgroups[optgroup], {
                        html: domToString(html_children),
                        dom: html_children
                    })));
                } else {
                    html.appendChild(groups[optgroup]);
                }
            }
            $dropdown_content.html(html);
            if (self.settings.highlight && results.query.length && results.tokens.length) {
                $dropdown_content.removeHighlight();
                for (i = 0, n = results.tokens.length; i < n; i++) {
                    highlight($dropdown_content, results.tokens[i].regex);
                }
            }
            if (!self.settings.hideSelected) {
                for (i = 0, n = self.items.length; i < n; i++) {
                    self.getOption(self.items[i]).addClass('selected');
                }
            }
            has_create_option = self.canCreate(query);
            if (has_create_option) {
                $dropdown_content.prepend(self.render('option_create', {
                    input: query
                }));
                $create = $($dropdown_content[0].childNodes[0]);
            }
            self.hasOptions = results.items.length > 0 || has_create_option;
            if (self.hasOptions) {
                if (results.items.length > 0) {
                    $active_before = active_before && self.getOption(active_before);
                    if ($active_before && $active_before.length) {
                        $active = $active_before;
                    } else if (self.settings.mode === 'single' && self.items.length) {
                        $active = self.getOption(self.items[0]);
                    }
                    if (!$active || !$active.length) {
                        if ($create && !self.settings.addPrecedence) {
                            $active = self.getAdjacentOption($create, 1);
                        } else {
                            $active = $dropdown_content.find('[data-selectable]:first');
                        }
                    }
                } else {
                    $active = $create;
                }
                self.setActiveOption($active);
                if (triggerDropdown && !self.isOpen) {
                    self.open();
                }
            } else {
                self.setActiveOption(null);
                if (triggerDropdown && self.isOpen) {
                    self.close();
                }
            }
        },
        addOption: function (data) {
            var i, n, value, self = this;
            if ($.isArray(data)) {
                for (i = 0, n = data.length; i < n; i++) {
                    self.addOption(data[i]);
                }
                return;
            }
            if (value = self.registerOption(data)) {
                self.userOptions[value] = true;
                self.lastQuery = null;
                self.trigger('option_add', value, data);
            }
        },
        registerOption: function (data) {
            var key = hash_key(data[this.settings.valueField]);
            if (typeof key === 'undefined' || key === null || this.options.hasOwnProperty(key)) return false;
            data.$order = data.$order || ++this.order;
            this.options[key] = data;
            return key;
        },
        registerOptionGroup: function (data) {
            var key = hash_key(data[this.settings.optgroupValueField]);
            if (!key) return false;
            data.$order = data.$order || ++this.order;
            this.optgroups[key] = data;
            return key;
        },
        addOptionGroup: function (id, data) {
            data[this.settings.optgroupValueField] = id;
            if (id = this.registerOptionGroup(data)) {
                this.trigger('optgroup_add', id, data);
            }
        },
        removeOptionGroup: function (id) {
            if (this.optgroups.hasOwnProperty(id)) {
                delete this.optgroups[id];
                this.renderCache = {};
                this.trigger('optgroup_remove', id);
            }
        },
        clearOptionGroups: function () {
            this.optgroups = {};
            this.renderCache = {};
            this.trigger('optgroup_clear');
        },
        updateOption: function (value, data) {
            var self = this;
            var $item, $item_new;
            var value_new, index_item, cache_items, cache_options, order_old;
            value = hash_key(value);
            value_new = hash_key(data[self.settings.valueField]);
            if (value === null) return;
            if (!self.options.hasOwnProperty(value)) return;
            if (typeof value_new !== 'string') throw new Error('Value must be set in option data');
            order_old = self.options[value].$order;
            if (value_new !== value) {
                delete self.options[value];
                index_item = self.items.indexOf(value);
                if (index_item !== -1) {
                    self.items.splice(index_item, 1, value_new);
                }
            }
            data.$order = data.$order || order_old;
            self.options[value_new] = data;
            cache_items = self.renderCache['item'];
            cache_options = self.renderCache['option'];
            if (cache_items) {
                delete cache_items[value];
                delete cache_items[value_new];
            }
            if (cache_options) {
                delete cache_options[value];
                delete cache_options[value_new];
            }
            if (self.items.indexOf(value_new) !== -1) {
                $item = self.getItem(value);
                $item_new = $(self.render('item', data));
                if ($item.hasClass('active')) $item_new.addClass('active');
                $item.replaceWith($item_new);
            }
            self.lastQuery = null;
            if (self.isOpen) {
                self.refreshOptions(false);
            }
        },
        removeOption: function (value, silent) {
            var self = this;
            value = hash_key(value);
            var cache_items = self.renderCache['item'];
            var cache_options = self.renderCache['option'];
            if (cache_items) delete cache_items[value];
            if (cache_options) delete cache_options[value];
            delete self.userOptions[value];
            delete self.options[value];
            self.lastQuery = null;
            self.trigger('option_remove', value);
            self.removeItem(value, silent);
        },
        clearOptions: function () {
            var self = this;
            self.loadedSearches = {};
            self.userOptions = {};
            self.renderCache = {};
            self.options = self.sifter.items = {};
            self.lastQuery = null;
            self.trigger('option_clear');
            self.clear();
        },
        getOption: function (value) {
            return this.getElementWithValue(value, this.$dropdown_content.find('[data-selectable]'));
        },
        getAdjacentOption: function ($option, direction) {
            var $options = this.$dropdown.find('[data-selectable]');
            var index = $options.index($option) + direction;
            return index >= 0 && index < $options.length ? $options.eq(index) : $();
        },
        getElementWithValue: function (value, $els) {
            value = hash_key(value);
            if (typeof value !== 'undefined' && value !== null) {
                for (var i = 0, n = $els.length; i < n; i++) {
                    if ($els[i].getAttribute('data-value') === value) {
                        return $($els[i]);
                    }
                }
            }
            return $();
        },
        getItem: function (value) {
            return this.getElementWithValue(value, this.$control.children());
        },
        addItems: function (values, silent) {
            var items = $.isArray(values) ? values : [values];
            for (var i = 0, n = items.length; i < n; i++) {
                this.isPending = (i < n - 1);
                this.addItem(items[i], silent);
            }
        },
        addItem: function (value, silent) {
            var events = silent ? [] : ['change'];
            debounce_events(this, events, function () {
                var $item, $option, $options;
                var self = this;
                var inputMode = self.settings.mode;
                var i, active, value_next, wasFull;
                value = hash_key(value);
                if (self.items.indexOf(value) !== -1) {
                    if (inputMode === 'single') self.close();
                    return;
                }
                if (!self.options.hasOwnProperty(value)) return;
                if (inputMode === 'single') self.clear(silent);
                if (inputMode === 'multi' && self.isFull()) return;
                $item = $(self.render('item', self.options[value]));
                wasFull = self.isFull();
                self.items.splice(self.caretPos, 0, value);
                self.insertAtCaret($item);
                if (!self.isPending || (!wasFull && self.isFull())) {
                    self.refreshState();
                }
                if (self.isSetup) {
                    $options = self.$dropdown_content.find('[data-selectable]');
                    if (!self.isPending) {
                        $option = self.getOption(value);
                        value_next = self.getAdjacentOption($option, 1).attr('data-value');
                        self.refreshOptions(self.isFocused && inputMode !== 'single');
                        if (value_next) {
                            self.setActiveOption(self.getOption(value_next));
                        }
                    }
                    if (!$options.length || self.isFull()) {
                        self.close();
                    } else {
                        self.positionDropdown();
                    }
                    self.updatePlaceholder();
                    self.trigger('item_add', value, $item);
                    self.updateOriginalInput({
                        silent: silent
                    });
                }
            });
        },
        removeItem: function (value, silent) {
            var self = this;
            var $item, i, idx;
            $item = (value instanceof $) ? value : self.getItem(value);
            value = hash_key($item.attr('data-value'));
            i = self.items.indexOf(value);
            if (i !== -1) {
                $item.remove();
                if ($item.hasClass('active')) {
                    idx = self.$activeItems.indexOf($item[0]);
                    self.$activeItems.splice(idx, 1);
                }
                self.items.splice(i, 1);
                self.lastQuery = null;
                if (!self.settings.persist && self.userOptions.hasOwnProperty(value)) {
                    self.removeOption(value, silent);
                }
                if (i < self.caretPos) {
                    self.setCaret(self.caretPos - 1);
                }
                self.refreshState();
                self.updatePlaceholder();
                self.updateOriginalInput({
                    silent: silent
                });
                self.positionDropdown();
                self.trigger('item_remove', value, $item);
            }
        },
        createItem: function (input, triggerDropdown) {
            var self = this;
            var caret = self.caretPos;
            input = input || $.trim(self.$control_input.val() || '');
            var callback = arguments[arguments.length - 1];
            if (typeof callback !== 'function') callback = function () {};
            if (typeof triggerDropdown !== 'boolean') {
                triggerDropdown = true;
            }
            if (!self.canCreate(input)) {
                callback();
                return false;
            }
            self.lock();
            var setup = (typeof self.settings.create === 'function') ? this.settings.create : function (input) {
                var data = {};
                data[self.settings.labelField] = input;
                data[self.settings.valueField] = input;
                return data;
            };
            var create = once(function (data) {
                self.unlock();
                if (!data || typeof data !== 'object') return callback();
                var value = hash_key(data[self.settings.valueField]);
                if (typeof value !== 'string') return callback();
                self.setTextboxValue('');
                self.addOption(data);
                self.setCaret(caret);
                self.addItem(value);
                self.refreshOptions(triggerDropdown && self.settings.mode !== 'single');
                callback(data);
            });
            var output = setup.apply(this, [input, create]);
            if (typeof output !== 'undefined') {
                create(output);
            }
            return true;
        },
        refreshItems: function () {
            this.lastQuery = null;
            if (this.isSetup) {
                this.addItem(this.items);
            }
            this.refreshState();
            this.updateOriginalInput();
        },
        refreshState: function () {
            this.refreshValidityState();
            this.refreshClasses();
        },
        refreshValidityState: function () {
            if (!this.isRequired) return false;
            var invalid = !this.items.length;
            this.isInvalid = invalid;
            this.$control_input.prop('required', invalid);
            this.$input.prop('required', !invalid);
        },
        refreshClasses: function () {
            var self = this;
            var isFull = self.isFull();
            var isLocked = self.isLocked;
            self.$wrapper.toggleClass('rtl', self.rtl);
            self.$control.toggleClass('focus', self.isFocused).toggleClass('disabled', self.isDisabled).toggleClass('required', self.isRequired).toggleClass('invalid', self.isInvalid).toggleClass('locked', isLocked).toggleClass('full', isFull).toggleClass('not-full', !isFull).toggleClass('input-active', self.isFocused && !self.isInputHidden).toggleClass('dropdown-active', self.isOpen).toggleClass('has-options', !$.isEmptyObject(self.options)).toggleClass('has-items', self.items.length > 0);
            self.$control_input.data('grow', !isFull && !isLocked);
        },
        isFull: function () {
            return this.settings.maxItems !== null && this.items.length >= this.settings.maxItems;
        },
        updateOriginalInput: function (opts) {
            var i, n, options, label, self = this;
            opts = opts || {};
            if (self.tagType === TAG_SELECT) {
                options = [];
                for (i = 0, n = self.items.length; i < n; i++) {
                    label = self.options[self.items[i]][self.settings.labelField] || '';
                    options.push('<option value="' + escape_html(self.items[i]) + '" selected="selected">' + escape_html(label) + '</option>');
                }
                if (!options.length && !this.$input.attr('multiple')) {
                    options.push('<option value="" selected="selected"></option>');
                }
                self.$input.html(options.join(''));
            } else {
                self.$input.val(self.getValue());
                self.$input.attr('value', self.$input.val());
            }
            if (self.isSetup) {
                if (!opts.silent) {
                    self.trigger('change', self.$input.val());
                }
            }
        },
        updatePlaceholder: function () {
            if (!this.settings.placeholder) return;
            var $input = this.$control_input;
            if (this.items.length) {
                $input.removeAttr('placeholder');
            } else {
                $input.attr('placeholder', this.settings.placeholder);
            }
            $input.triggerHandler('update', {
                force: true
            });
        },
        open: function () {
            var self = this;
            if (self.isLocked || self.isOpen || (self.settings.mode === 'multi' && self.isFull())) return;
            self.focus();
            self.isOpen = true;
            self.refreshState();
            self.$dropdown.css({
                visibility: 'hidden',
                display: 'block'
            });
            self.positionDropdown();
            self.$dropdown.css({
                visibility: 'visible'
            });
            self.trigger('dropdown_open', self.$dropdown);
        },
        close: function () {
            var self = this;
            var trigger = self.isOpen;
            if (self.settings.mode === 'single' && self.items.length) {
                self.hideInput();
                self.$control_input.blur();
            }
            self.isOpen = false;
            self.$dropdown.hide();
            self.setActiveOption(null);
            self.refreshState();
            if (trigger) self.trigger('dropdown_close', self.$dropdown);
        },
        positionDropdown: function () {
            var $control = this.$control;
            var offset = this.settings.dropdownParent === 'body' ? $control.offset() : $control.position();
            offset.top += $control.outerHeight(true);
            this.$dropdown.css({
                width: $control.outerWidth(),
                top: offset.top,
                left: offset.left
            });
        },
        clear: function (silent) {
            var self = this;
            if (!self.items.length) return;
            self.$control.children(':not(input)').remove();
            self.items = [];
            self.lastQuery = null;
            self.setCaret(0);
            self.setActiveItem(null);
            self.updatePlaceholder();
            self.updateOriginalInput({
                silent: silent
            });
            self.refreshState();
            self.showInput();
            self.trigger('clear');
        },
        insertAtCaret: function ($el) {
            var caret = Math.min(this.caretPos, this.items.length);
            if (caret === 0) {
                this.$control.prepend($el);
            } else {
                $(this.$control[0].childNodes[caret]).before($el);
            }
            this.setCaret(caret + 1);
        },
        deleteSelection: function (e) {
            var i, n, direction, selection, values, caret, option_select, $option_select, $tail;
            var self = this;
            direction = (e && e.keyCode === KEY_BACKSPACE) ? -1 : 1;
            selection = getSelection(self.$control_input[0]);
            if (self.$activeOption && !self.settings.hideSelected) {
                option_select = self.getAdjacentOption(self.$activeOption, -1).attr('data-value');
            }
            values = [];
            if (self.$activeItems.length) {
                $tail = self.$control.children('.active:' + (direction > 0 ? 'last' : 'first'));
                caret = self.$control.children(':not(input)').index($tail);
                if (direction > 0) {
                    caret++;
                }
                for (i = 0, n = self.$activeItems.length; i < n; i++) {
                    values.push($(self.$activeItems[i]).attr('data-value'));
                }
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            } else if ((self.isFocused || self.settings.mode === 'single') && self.items.length) {
                if (direction < 0 && selection.start === 0 && selection.length === 0) {
                    values.push(self.items[self.caretPos - 1]);
                } else if (direction > 0 && selection.start === self.$control_input.val().length) {
                    values.push(self.items[self.caretPos]);
                }
            }
            if (!values.length || (typeof self.settings.onDelete === 'function' && self.settings.onDelete.apply(self, [values]) === false)) {
                return false;
            }
            if (typeof caret !== 'undefined') {
                self.setCaret(caret);
            }
            while (values.length) {
                self.removeItem(values.pop());
            }
            self.showInput();
            self.positionDropdown();
            self.refreshOptions(true);
            if (option_select) {
                $option_select = self.getOption(option_select);
                if ($option_select.length) {
                    self.setActiveOption($option_select);
                }
            }
            return true;
        },
        advanceSelection: function (direction, e) {
            var tail, selection, idx, valueLength, cursorAtEdge, $tail;
            var self = this;
            if (direction === 0) return;
            if (self.rtl) direction *= -1;
            tail = direction > 0 ? 'last' : 'first';
            selection = getSelection(self.$control_input[0]);
            if (self.isFocused && !self.isInputHidden) {
                valueLength = self.$control_input.val().length;
                cursorAtEdge = direction < 0 ? selection.start === 0 && selection.length === 0 : selection.start === valueLength;
                if (cursorAtEdge && !valueLength) {
                    self.advanceCaret(direction, e);
                }
            } else {
                $tail = self.$control.children('.active:' + tail);
                if ($tail.length) {
                    idx = self.$control.children(':not(input)').index($tail);
                    self.setActiveItem(null);
                    self.setCaret(direction > 0 ? idx + 1 : idx);
                }
            }
        },
        advanceCaret: function (direction, e) {
            var self = this,
                fn, $adj;
            if (direction === 0) return;
            fn = direction > 0 ? 'next' : 'prev';
            if (self.isShiftDown) {
                $adj = self.$control_input[fn]();
                if ($adj.length) {
                    self.hideInput();
                    self.setActiveItem($adj);
                    e && e.preventDefault();
                }
            } else {
                self.setCaret(self.caretPos + direction);
            }
        },
        setCaret: function (i) {
            var self = this;
            if (self.settings.mode === 'single') {
                i = self.items.length;
            } else {
                i = Math.max(0, Math.min(self.items.length, i));
            }
            if (!self.isPending) {
                var j, n, fn, $children, $child;
                $children = self.$control.children(':not(input)');
                for (j = 0, n = $children.length; j < n; j++) {
                    $child = $($children[j]).detach();
                    if (j < i) {
                        self.$control_input.before($child);
                    } else {
                        self.$control.append($child);
                    }
                }
            }
            self.caretPos = i;
        },
        lock: function () {
            this.close();
            this.isLocked = true;
            this.refreshState();
        },
        unlock: function () {
            this.isLocked = false;
            this.refreshState();
        },
        disable: function () {
            var self = this;
            self.$input.prop('disabled', true);
            self.$control_input.prop('disabled', true).prop('tabindex', -1);
            self.isDisabled = true;
            self.lock();
        },
        enable: function () {
            var self = this;
            self.$input.prop('disabled', false);
            self.$control_input.prop('disabled', false).prop('tabindex', self.tabIndex);
            self.isDisabled = false;
            self.unlock();
        },
        destroy: function () {
            var self = this;
            var eventNS = self.eventNS;
            var revertSettings = self.revertSettings;
            self.trigger('destroy');
            self.off();
            self.$wrapper.remove();
            self.$dropdown.remove();
            self.$input.html('').append(revertSettings.$children).removeAttr('tabindex').removeClass('selectized').attr({
                tabindex: revertSettings.tabindex
            }).show();
            self.$control_input.removeData('grow');
            self.$input.removeData('selectize');
            $(window).off(eventNS);
            $(document).off(eventNS);
            $(document.body).off(eventNS);
            delete self.$input[0].selectize;
        },
        render: function (templateName, data) {
            var value, id, label;
            var html = '';
            var cache = false;
            var self = this;
            var regex_tag = /^[\t \r\n]*<([a-z][a-z0-9\-_]*(?:\:[a-z][a-z0-9\-_]*)?)/i;
            if (templateName === 'option' || templateName === 'item') {
                value = hash_key(data[self.settings.valueField]);
                cache = !!value;
            }
            if (cache) {
                if (!isset(self.renderCache[templateName])) {
                    self.renderCache[templateName] = {};
                }
                if (self.renderCache[templateName].hasOwnProperty(value)) {
                    return self.renderCache[templateName][value];
                }
            }
            html = $(self.settings.render[templateName].apply(this, [data, escape_html]));
            if (templateName === 'option' || templateName === 'option_create') {
                html.attr('data-selectable', '');
            } else if (templateName === 'optgroup') {
                id = data[self.settings.optgroupValueField] || '';
                html.attr('data-group', id);
            }
            if (templateName === 'option' || templateName === 'item') {
                html.attr('data-value', value || '');
            }
            if (cache) {
                self.renderCache[templateName][value] = html[0];
            }
            return html[0];
        },
        clearCache: function (templateName) {
            var self = this;
            if (typeof templateName === 'undefined') {
                self.renderCache = {};
            } else {
                delete self.renderCache[templateName];
            }
        },
        canCreate: function (input) {
            var self = this;
            if (!self.settings.create) return false;
            var filter = self.settings.createFilter;
            return input.length && (typeof filter !== 'function' || filter.apply(self, [input])) && (typeof filter !== 'string' || new RegExp(filter).test(input)) && (!(filter instanceof RegExp) || filter.test(input));
        }
    });
    Selectize.count = 0;
    Selectize.defaults = {
        options: [],
        optgroups: [],
        plugins: [],
        delimiter: ',',
        splitOn: null,
        persist: true,
        diacritics: true,
        create: false,
        createOnBlur: false,
        createFilter: null,
        highlight: true,
        openOnFocus: true,
        maxOptions: 1000,
        maxItems: null,
        hideSelected: null,
        addPrecedence: false,
        selectOnTab: false,
        preload: false,
        allowEmptyOption: false,
        closeAfterSelect: false,
        scrollDuration: 60,
        loadThrottle: 300,
        loadingClass: 'loading',
        dataAttr: 'data-data',
        optgroupField: 'optgroup',
        valueField: 'value',
        labelField: 'text',
        optgroupLabelField: 'label',
        optgroupValueField: 'value',
        lockOptgroupOrder: false,
        sortField: '$order',
        searchField: ['text'],
        searchConjunction: 'and',
        mode: null,
        wrapperClass: 'selectize-control',
        inputClass: 'selectize-input',
        dropdownClass: 'selectize-dropdown',
        dropdownContentClass: 'selectize-dropdown-content',
        dropdownParent: null,
        copyClassesToDropdown: true,
        render: {}
    };
    $.fn.selectize = function (settings_user) {
        var defaults = $.fn.selectize.defaults;
        var settings = $.extend({}, defaults, settings_user);
        var attr_data = settings.dataAttr;
        var field_label = settings.labelField;
        var field_value = settings.valueField;
        var field_optgroup = settings.optgroupField;
        var field_optgroup_label = settings.optgroupLabelField;
        var field_optgroup_value = settings.optgroupValueField;
        var init_textbox = function ($input, settings_element) {
            var i, n, values, option;
            var data_raw = $input.attr(attr_data);
            if (!data_raw) {
                var value = $.trim($input.val() || '');
                if (!settings.allowEmptyOption && !value.length) return;
                values = value.split(settings.delimiter);
                for (i = 0, n = values.length; i < n; i++) {
                    option = {};
                    option[field_label] = values[i];
                    option[field_value] = values[i];
                    settings_element.options.push(option);
                }
                settings_element.items = values;
            } else {
                settings_element.options = JSON.parse(data_raw);
                for (i = 0, n = settings_element.options.length; i < n; i++) {
                    settings_element.items.push(settings_element.options[i][field_value]);
                }
            }
        };
        var init_select = function ($input, settings_element) {
            var i, n, tagName, $children, order = 0;
            var options = settings_element.options;
            var optionsMap = {};
            var readData = function ($el) {
                var data = attr_data && $el.attr(attr_data);
                if (typeof data === 'string' && data.length) {
                    return JSON.parse(data);
                }
                return null;
            };
            var addOption = function ($option, group) {
                $option = $($option);
                var value = hash_key($option.val());
                if (!value && !settings.allowEmptyOption) return;
                if (optionsMap.hasOwnProperty(value)) {
                    if (group) {
                        var arr = optionsMap[value][field_optgroup];
                        if (!arr) {
                            optionsMap[value][field_optgroup] = group;
                        } else if (!$.isArray(arr)) {
                            optionsMap[value][field_optgroup] = [arr, group];
                        } else {
                            arr.push(group);
                        }
                    }
                    return;
                }
                var option = readData($option) || {};
                option[field_label] = option[field_label] || $option.text();
                option[field_value] = option[field_value] || value;
                option[field_optgroup] = option[field_optgroup] || group;
                optionsMap[value] = option;
                options.push(option);
                if ($option.is(':selected')) {
                    settings_element.items.push(value);
                }
            };
            var addGroup = function ($optgroup) {
                var i, n, id, optgroup, $options;
                $optgroup = $($optgroup);
                id = $optgroup.attr('label');
                if (id) {
                    optgroup = readData($optgroup) || {};
                    optgroup[field_optgroup_label] = id;
                    optgroup[field_optgroup_value] = id;
                    settings_element.optgroups.push(optgroup);
                }
                $options = $('option', $optgroup);
                for (i = 0, n = $options.length; i < n; i++) {
                    addOption($options[i], id);
                }
            };
            settings_element.maxItems = $input.attr('multiple') ? null : 1;
            $children = $input.children();
            for (i = 0, n = $children.length; i < n; i++) {
                tagName = $children[i].tagName.toLowerCase();
                if (tagName === 'optgroup') {
                    addGroup($children[i]);
                } else if (tagName === 'option') {
                    addOption($children[i]);
                }
            }
        };
        return this.each(function () {
            if (this.selectize) return;
            var instance;
            var $input = $(this);
            var tag_name = this.tagName.toLowerCase();
            var placeholder = $input.attr('placeholder') || $input.attr('data-placeholder');
            if (!placeholder && !settings.allowEmptyOption) {
                placeholder = $input.children('option[value=""]').text();
            }
            var settings_element = {
                'placeholder': placeholder,
                'options': [],
                'optgroups': [],
                'items': []
            };
            if (tag_name === 'select') {
                init_select($input, settings_element);
            } else {
                init_textbox($input, settings_element);
            }
            instance = new Selectize($input, $.extend(true, {}, defaults, settings_element, settings_user));
        });
    };
    $.fn.selectize.defaults = Selectize.defaults;
    $.fn.selectize.support = {
        validity: SUPPORTS_VALIDITY_API
    };
    Selectize.define('drag_drop', function (options) {
        if (!$.fn.sortable) throw new Error('The "drag_drop" plugin requires jQuery UI "sortable".');
        if (this.settings.mode !== 'multi') return;
        var self = this;
        self.lock = (function () {
            var original = self.lock;
            return function () {
                var sortable = self.$control.data('sortable');
                if (sortable) sortable.disable();
                return original.apply(self, arguments);
            };
        })();
        self.unlock = (function () {
            var original = self.unlock;
            return function () {
                var sortable = self.$control.data('sortable');
                if (sortable) sortable.enable();
                return original.apply(self, arguments);
            };
        })();
        self.setup = (function () {
            var original = self.setup;
            return function () {
                original.apply(this, arguments);
                var $control = self.$control.sortable({
                    items: '[data-value]',
                    forcePlaceholderSize: true,
                    disabled: self.isLocked,
                    start: function (e, ui) {
                        ui.placeholder.css('width', ui.helper.css('width'));
                        $control.css({
                            overflow: 'visible'
                        });
                    },
                    stop: function () {
                        $control.css({
                            overflow: 'hidden'
                        });
                        var active = self.$activeItems ? self.$activeItems.slice() : null;
                        var values = [];
                        $control.children('[data-value]').each(function () {
                            values.push($(this).attr('data-value'));
                        });
                        self.setValue(values);
                        self.setActiveItem(active);
                    }
                });
            };
        })();
    });
    Selectize.define('dropdown_header', function (options) {
        var self = this;
        options = $.extend({
            title: 'Untitled',
            headerClass: 'selectize-dropdown-header',
            titleRowClass: 'selectize-dropdown-header-title',
            labelClass: 'selectize-dropdown-header-label',
            closeClass: 'selectize-dropdown-header-close',
            html: function (data) {
                return ('<div class="' + data.headerClass + '">' +
                    '<div class="' + data.titleRowClass + '">' +
                    '<span class="' + data.labelClass + '">' + data.title + '</span>' +
                    '<a href="javascript:void(0)" class="' + data.closeClass + '">&times;</a>' +
                    '</div>' +
                    '</div>');
            }
        }, options);
        self.setup = (function () {
            var original = self.setup;
            return function () {
                original.apply(self, arguments);
                self.$dropdown_header = $(options.html(options));
                self.$dropdown.prepend(self.$dropdown_header);
            };
        })();
    });
    Selectize.define('optgroup_columns', function (options) {
        var self = this;
        options = $.extend({
            equalizeWidth: true,
            equalizeHeight: true
        }, options);
        this.getAdjacentOption = function ($option, direction) {
            var $options = $option.closest('[data-group]').find('[data-selectable]');
            var index = $options.index($option) + direction;
            return index >= 0 && index < $options.length ? $options.eq(index) : $();
        };
        this.onKeyDown = (function () {
            var original = self.onKeyDown;
            return function (e) {
                var index, $option, $options, $optgroup;
                if (this.isOpen && (e.keyCode === KEY_LEFT || e.keyCode === KEY_RIGHT)) {
                    self.ignoreHover = true;
                    $optgroup = this.$activeOption.closest('[data-group]');
                    index = $optgroup.find('[data-selectable]').index(this.$activeOption);
                    if (e.keyCode === KEY_LEFT) {
                        $optgroup = $optgroup.prev('[data-group]');
                    } else {
                        $optgroup = $optgroup.next('[data-group]');
                    }
                    $options = $optgroup.find('[data-selectable]');
                    $option = $options.eq(Math.min($options.length - 1, index));
                    if ($option.length) {
                        this.setActiveOption($option);
                    }
                    return;
                }
                return original.apply(this, arguments);
            };
        })();
        var getScrollbarWidth = function () {
            var div;
            var width = getScrollbarWidth.width;
            var doc = document;
            if (typeof width === 'undefined') {
                div = doc.createElement('div');
                div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>';
                div = div.firstChild;
                doc.body.appendChild(div);
                width = getScrollbarWidth.width = div.offsetWidth - div.clientWidth;
                doc.body.removeChild(div);
            }
            return width;
        };
        var equalizeSizes = function () {
            var i, n, height_max, width, width_last, width_parent, $optgroups;
            $optgroups = $('[data-group]', self.$dropdown_content);
            n = $optgroups.length;
            if (!n || !self.$dropdown_content.width()) return;
            if (options.equalizeHeight) {
                height_max = 0;
                for (i = 0; i < n; i++) {
                    height_max = Math.max(height_max, $optgroups.eq(i).height());
                }
                $optgroups.css({
                    height: height_max
                });
            }
            if (options.equalizeWidth) {
                width_parent = self.$dropdown_content.innerWidth() - getScrollbarWidth();
                width = Math.round(width_parent / n);
                $optgroups.css({
                    width: width
                });
                if (n > 1) {
                    width_last = width_parent - width * (n - 1);
                    $optgroups.eq(n - 1).css({
                        width: width_last
                    });
                }
            }
        };
        if (options.equalizeHeight || options.equalizeWidth) {
            hook.after(this, 'positionDropdown', equalizeSizes);
            hook.after(this, 'refreshOptions', equalizeSizes);
        }
    });
    Selectize.define('remove_button', function (options) {
        options = $.extend({
            label: '&times;',
            title: 'Remove',
            className: 'remove',
            append: true
        }, options);
        var singleClose = function (thisRef, options) {
            options.className = 'remove-single';
            var self = thisRef;
            var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html(options.title) + '">' + options.label + '</a>';
            var append = function (html_container, html_element) {
                return html_container + html_element;
            };
            thisRef.setup = (function () {
                var original = self.setup;
                return function () {
                    if (options.append) {
                        var id = $(self.$input.context).attr('id');
                        var selectizer = $('#' + id);
                        var render_item = self.settings.render.item;
                        self.settings.render.item = function (data) {
                            return append(render_item.apply(thisRef, arguments), html);
                        };
                    }
                    original.apply(thisRef, arguments);
                    thisRef.$control.on('click', '.' + options.className, function (e) {
                        e.preventDefault();
                        if (self.isLocked) return;
                        self.clear();
                    });
                };
            })();
        };
        var multiClose = function (thisRef, options) {
            var self = thisRef;
            var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html(options.title) + '">' + options.label + '</a>';
            var append = function (html_container, html_element) {
                var pos = html_container.search(/(<\/[^>]+>\s*)$/);
                return html_container.substring(0, pos) + html_element + html_container.substring(pos);
            };
            thisRef.setup = (function () {
                var original = self.setup;
                return function () {
                    if (options.append) {
                        var render_item = self.settings.render.item;
                        self.settings.render.item = function (data) {
                            return append(render_item.apply(thisRef, arguments), html);
                        };
                    }
                    original.apply(thisRef, arguments);
                    thisRef.$control.on('click', '.' + options.className, function (e) {
                        e.preventDefault();
                        if (self.isLocked) return;
                        var $item = $(e.currentTarget).parent();
                        self.setActiveItem($item);
                        if (self.deleteSelection()) {
                            self.setCaret(self.items.length);
                        }
                    });
                };
            })();
        };
        if (this.settings.mode === 'single') {
            singleClose(this, options);
            return;
        } else {
            multiClose(this, options);
        }
    });
    Selectize.define('restore_on_backspace', function (options) {
        var self = this;
        options.text = options.text || function (option) {
            return option[this.settings.labelField];
        };
        this.onKeyDown = (function () {
            var original = self.onKeyDown;
            return function (e) {
                var index, option;
                if (e.keyCode === KEY_BACKSPACE && this.$control_input.val() === '' && !this.$activeItems.length) {
                    index = this.caretPos - 1;
                    if (index >= 0 && index < this.items.length) {
                        option = this.options[this.items[index]];
                        if (this.deleteSelection(e)) {
                            this.setTextboxValue(options.text.apply(this, [option]));
                            this.refreshOptions(true);
                        }
                        e.preventDefault();
                        return;
                    }
                }
                return original.apply(this, arguments);
            };
        })();
    });
    return Selectize;
}));
var QRCode;
(function () {
    function QR8bitByte(data) {
        this.mode = QRMode.MODE_8BIT_BYTE;
        this.data = data;
        this.parsedData = [];
        for (var i = 0, l = this.data.length; i < l; i++) {
            var byteArray = [];
            var code = this.data.charCodeAt(i);
            if (code > 0x10000) {
                byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
                byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
                byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
                byteArray[3] = 0x80 | (code & 0x3F);
            } else if (code > 0x800) {
                byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
                byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
                byteArray[2] = 0x80 | (code & 0x3F);
            } else if (code > 0x80) {
                byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
                byteArray[1] = 0x80 | (code & 0x3F);
            } else {
                byteArray[0] = code;
            }
            this.parsedData.push(byteArray);
        }
        this.parsedData = Array.prototype.concat.apply([], this.parsedData);
        if (this.parsedData.length != this.data.length) {
            this.parsedData.unshift(191);
            this.parsedData.unshift(187);
            this.parsedData.unshift(239);
        }
    }
    QR8bitByte.prototype = {
        getLength: function (buffer) {
            return this.parsedData.length;
        },
        write: function (buffer) {
            for (var i = 0, l = this.parsedData.length; i < l; i++) {
                buffer.put(this.parsedData[i], 8);
            }
        }
    };

    function QRCodeModel(typeNumber, errorCorrectLevel) {
        this.typeNumber = typeNumber;
        this.errorCorrectLevel = errorCorrectLevel;
        this.modules = null;
        this.moduleCount = 0;
        this.dataCache = null;
        this.dataList = [];
    }
    QRCodeModel.prototype = {
        addData: function (data) {
            var newData = new QR8bitByte(data);
            this.dataList.push(newData);
            this.dataCache = null;
        },
        isDark: function (row, col) {
            if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
                throw new Error(row + "," + col);
            }
            return this.modules[row][col];
        },
        getModuleCount: function () {
            return this.moduleCount;
        },
        make: function () {
            this.makeImpl(false, this.getBestMaskPattern());
        },
        makeImpl: function (test, maskPattern) {
            this.moduleCount = this.typeNumber * 4 + 17;
            this.modules = new Array(this.moduleCount);
            for (var row = 0; row < this.moduleCount; row++) {
                this.modules[row] = new Array(this.moduleCount);
                for (var col = 0; col < this.moduleCount; col++) {
                    this.modules[row][col] = null;
                }
            }
            this.setupPositionProbePattern(0, 0);
            this.setupPositionProbePattern(this.moduleCount - 7, 0);
            this.setupPositionProbePattern(0, this.moduleCount - 7);
            this.setupPositionAdjustPattern();
            this.setupTimingPattern();
            this.setupTypeInfo(test, maskPattern);
            if (this.typeNumber >= 7) {
                this.setupTypeNumber(test);
            }
            if (this.dataCache == null) {
                this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
            }
            this.mapData(this.dataCache, maskPattern);
        },
        setupPositionProbePattern: function (row, col) {
            for (var r = -1; r <= 7; r++) {
                if (row + r <= -1 || this.moduleCount <= row + r) continue;
                for (var c = -1; c <= 7; c++) {
                    if (col + c <= -1 || this.moduleCount <= col + c) continue;
                    if ((0 <= r && r <= 6 && (c == 0 || c == 6)) || (0 <= c && c <= 6 && (r == 0 || r == 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                        this.modules[row + r][col + c] = true;
                    } else {
                        this.modules[row + r][col + c] = false;
                    }
                }
            }
        },
        getBestMaskPattern: function () {
            var minLostPoint = 0;
            var pattern = 0;
            for (var i = 0; i < 8; i++) {
                this.makeImpl(true, i);
                var lostPoint = QRUtil.getLostPoint(this);
                if (i == 0 || minLostPoint > lostPoint) {
                    minLostPoint = lostPoint;
                    pattern = i;
                }
            }
            return pattern;
        },
        createMovieClip: function (target_mc, instance_name, depth) {
            var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
            var cs = 1;
            this.make();
            for (var row = 0; row < this.modules.length; row++) {
                var y = row * cs;
                for (var col = 0; col < this.modules[row].length; col++) {
                    var x = col * cs;
                    var dark = this.modules[row][col];
                    if (dark) {
                        qr_mc.beginFill(0, 100);
                        qr_mc.moveTo(x, y);
                        qr_mc.lineTo(x + cs, y);
                        qr_mc.lineTo(x + cs, y + cs);
                        qr_mc.lineTo(x, y + cs);
                        qr_mc.endFill();
                    }
                }
            }
            return qr_mc;
        },
        setupTimingPattern: function () {
            for (var r = 8; r < this.moduleCount - 8; r++) {
                if (this.modules[r][6] != null) {
                    continue;
                }
                this.modules[r][6] = (r % 2 == 0);
            }
            for (var c = 8; c < this.moduleCount - 8; c++) {
                if (this.modules[6][c] != null) {
                    continue;
                }
                this.modules[6][c] = (c % 2 == 0);
            }
        },
        setupPositionAdjustPattern: function () {
            var pos = QRUtil.getPatternPosition(this.typeNumber);
            for (var i = 0; i < pos.length; i++) {
                for (var j = 0; j < pos.length; j++) {
                    var row = pos[i];
                    var col = pos[j];
                    if (this.modules[row][col] != null) {
                        continue;
                    }
                    for (var r = -2; r <= 2; r++) {
                        for (var c = -2; c <= 2; c++) {
                            if (r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)) {
                                this.modules[row + r][col + c] = true;
                            } else {
                                this.modules[row + r][col + c] = false;
                            }
                        }
                    }
                }
            }
        },
        setupTypeNumber: function (test) {
            var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
            for (var i = 0; i < 18; i++) {
                var mod = (!test && ((bits >> i) & 1) == 1);
                this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
            }
            for (var i = 0; i < 18; i++) {
                var mod = (!test && ((bits >> i) & 1) == 1);
                this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
            }
        },
        setupTypeInfo: function (test, maskPattern) {
            var data = (this.errorCorrectLevel << 3) | maskPattern;
            var bits = QRUtil.getBCHTypeInfo(data);
            for (var i = 0; i < 15; i++) {
                var mod = (!test && ((bits >> i) & 1) == 1);
                if (i < 6) {
                    this.modules[i][8] = mod;
                } else if (i < 8) {
                    this.modules[i + 1][8] = mod;
                } else {
                    this.modules[this.moduleCount - 15 + i][8] = mod;
                }
            }
            for (var i = 0; i < 15; i++) {
                var mod = (!test && ((bits >> i) & 1) == 1);
                if (i < 8) {
                    this.modules[8][this.moduleCount - i - 1] = mod;
                } else if (i < 9) {
                    this.modules[8][15 - i - 1 + 1] = mod;
                } else {
                    this.modules[8][15 - i - 1] = mod;
                }
            }
            this.modules[this.moduleCount - 8][8] = (!test);
        },
        mapData: function (data, maskPattern) {
            var inc = -1;
            var row = this.moduleCount - 1;
            var bitIndex = 7;
            var byteIndex = 0;
            for (var col = this.moduleCount - 1; col > 0; col -= 2) {
                if (col == 6) col--;
                while (true) {
                    for (var c = 0; c < 2; c++) {
                        if (this.modules[row][col - c] == null) {
                            var dark = false;
                            if (byteIndex < data.length) {
                                dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
                            }
                            var mask = QRUtil.getMask(maskPattern, row, col - c);
                            if (mask) {
                                dark = !dark;
                            }
                            this.modules[row][col - c] = dark;
                            bitIndex--;
                            if (bitIndex == -1) {
                                byteIndex++;
                                bitIndex = 7;
                            }
                        }
                    }
                    row += inc;
                    if (row < 0 || this.moduleCount <= row) {
                        row -= inc;
                        inc = -inc;
                        break;
                    }
                }
            }
        }
    };
    QRCodeModel.PAD0 = 0xEC;
    QRCodeModel.PAD1 = 0x11;
    QRCodeModel.createData = function (typeNumber, errorCorrectLevel, dataList) {
        var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
        var buffer = new QRBitBuffer();
        for (var i = 0; i < dataList.length; i++) {
            var data = dataList[i];
            buffer.put(data.mode, 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
            data.write(buffer);
        }
        var totalDataCount = 0;
        for (var i = 0; i < rsBlocks.length; i++) {
            totalDataCount += rsBlocks[i].dataCount;
        }
        if (buffer.getLengthInBits() > totalDataCount * 8) {
            throw new Error("code length overflow. (" +
                buffer.getLengthInBits() +
                ">" +
                totalDataCount * 8 +
                ")");
        }
        if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
            buffer.put(0, 4);
        }
        while (buffer.getLengthInBits() % 8 != 0) {
            buffer.putBit(false);
        }
        while (true) {
            if (buffer.getLengthInBits() >= totalDataCount * 8) {
                break;
            }
            buffer.put(QRCodeModel.PAD0, 8);
            if (buffer.getLengthInBits() >= totalDataCount * 8) {
                break;
            }
            buffer.put(QRCodeModel.PAD1, 8);
        }
        return QRCodeModel.createBytes(buffer, rsBlocks);
    };
    QRCodeModel.createBytes = function (buffer, rsBlocks) {
        var offset = 0;
        var maxDcCount = 0;
        var maxEcCount = 0;
        var dcdata = new Array(rsBlocks.length);
        var ecdata = new Array(rsBlocks.length);
        for (var r = 0; r < rsBlocks.length; r++) {
            var dcCount = rsBlocks[r].dataCount;
            var ecCount = rsBlocks[r].totalCount - dcCount;
            maxDcCount = Math.max(maxDcCount, dcCount);
            maxEcCount = Math.max(maxEcCount, ecCount);
            dcdata[r] = new Array(dcCount);
            for (var i = 0; i < dcdata[r].length; i++) {
                dcdata[r][i] = 0xff & buffer.buffer[i + offset];
            }
            offset += dcCount;
            var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
            var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
            var modPoly = rawPoly.mod(rsPoly);
            ecdata[r] = new Array(rsPoly.getLength() - 1);
            for (var i = 0; i < ecdata[r].length; i++) {
                var modIndex = i + modPoly.getLength() - ecdata[r].length;
                ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
            }
        }
        var totalCodeCount = 0;
        for (var i = 0; i < rsBlocks.length; i++) {
            totalCodeCount += rsBlocks[i].totalCount;
        }
        var data = new Array(totalCodeCount);
        var index = 0;
        for (var i = 0; i < maxDcCount; i++) {
            for (var r = 0; r < rsBlocks.length; r++) {
                if (i < dcdata[r].length) {
                    data[index++] = dcdata[r][i];
                }
            }
        }
        for (var i = 0; i < maxEcCount; i++) {
            for (var r = 0; r < rsBlocks.length; r++) {
                if (i < ecdata[r].length) {
                    data[index++] = ecdata[r][i];
                }
            }
        }
        return data;
    };
    var QRMode = {
        MODE_NUMBER: 1 << 0,
        MODE_ALPHA_NUM: 1 << 1,
        MODE_8BIT_BYTE: 1 << 2,
        MODE_KANJI: 1 << 3
    };
    var QRErrorCorrectLevel = {
        L: 1,
        M: 0,
        Q: 3,
        H: 2
    };
    var QRMaskPattern = {
        PATTERN000: 0,
        PATTERN001: 1,
        PATTERN010: 2,
        PATTERN011: 3,
        PATTERN100: 4,
        PATTERN101: 5,
        PATTERN110: 6,
        PATTERN111: 7
    };
    var QRUtil = {
        PATTERN_POSITION_TABLE: [
            [],
            [6, 18],
            [6, 22],
            [6, 26],
            [6, 30],
            [6, 34],
            [6, 22, 38],
            [6, 24, 42],
            [6, 26, 46],
            [6, 28, 50],
            [6, 30, 54],
            [6, 32, 58],
            [6, 34, 62],
            [6, 26, 46, 66],
            [6, 26, 48, 70],
            [6, 26, 50, 74],
            [6, 30, 54, 78],
            [6, 30, 56, 82],
            [6, 30, 58, 86],
            [6, 34, 62, 90],
            [6, 28, 50, 72, 94],
            [6, 26, 50, 74, 98],
            [6, 30, 54, 78, 102],
            [6, 28, 54, 80, 106],
            [6, 32, 58, 84, 110],
            [6, 30, 58, 86, 114],
            [6, 34, 62, 90, 118],
            [6, 26, 50, 74, 98, 122],
            [6, 30, 54, 78, 102, 126],
            [6, 26, 52, 78, 104, 130],
            [6, 30, 56, 82, 108, 134],
            [6, 34, 60, 86, 112, 138],
            [6, 30, 58, 86, 114, 142],
            [6, 34, 62, 90, 118, 146],
            [6, 30, 54, 78, 102, 126, 150],
            [6, 24, 50, 76, 102, 128, 154],
            [6, 28, 54, 80, 106, 132, 158],
            [6, 32, 58, 84, 110, 136, 162],
            [6, 26, 54, 82, 110, 138, 166],
            [6, 30, 58, 86, 114, 142, 170]
        ],
        G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
        G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
        G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
        getBCHTypeInfo: function (data) {
            var d = data << 10;
            while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
                d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
            }
            return ((data << 10) | d) ^ QRUtil.G15_MASK;
        },
        getBCHTypeNumber: function (data) {
            var d = data << 12;
            while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
                d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18)));
            }
            return (data << 12) | d;
        },
        getBCHDigit: function (data) {
            var digit = 0;
            while (data != 0) {
                digit++;
                data >>>= 1;
            }
            return digit;
        },
        getPatternPosition: function (typeNumber) {
            return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
        },
        getMask: function (maskPattern, i, j) {
            switch (maskPattern) {
                case QRMaskPattern.PATTERN000:
                    return (i + j) % 2 == 0;
                case QRMaskPattern.PATTERN001:
                    return i % 2 == 0;
                case QRMaskPattern.PATTERN010:
                    return j % 3 == 0;
                case QRMaskPattern.PATTERN011:
                    return (i + j) % 3 == 0;
                case QRMaskPattern.PATTERN100:
                    return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
                case QRMaskPattern.PATTERN101:
                    return (i * j) % 2 + (i * j) % 3 == 0;
                case QRMaskPattern.PATTERN110:
                    return ((i * j) % 2 + (i * j) % 3) % 2 == 0;
                case QRMaskPattern.PATTERN111:
                    return ((i * j) % 3 + (i + j) % 2) % 2 == 0;
                default:
                    throw new Error("bad maskPattern:" + maskPattern);
            }
        },
        getErrorCorrectPolynomial: function (errorCorrectLength) {
            var a = new QRPolynomial([1], 0);
            for (var i = 0; i < errorCorrectLength; i++) {
                a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
            }
            return a;
        },
        getLengthInBits: function (mode, type) {
            if (1 <= type && type < 10) {
                switch (mode) {
                    case QRMode.MODE_NUMBER:
                        return 10;
                    case QRMode.MODE_ALPHA_NUM:
                        return 9;
                    case QRMode.MODE_8BIT_BYTE:
                        return 8;
                    case QRMode.MODE_KANJI:
                        return 8;
                    default:
                        throw new Error("mode:" + mode);
                }
            } else if (type < 27) {
                switch (mode) {
                    case QRMode.MODE_NUMBER:
                        return 12;
                    case QRMode.MODE_ALPHA_NUM:
                        return 11;
                    case QRMode.MODE_8BIT_BYTE:
                        return 16;
                    case QRMode.MODE_KANJI:
                        return 10;
                    default:
                        throw new Error("mode:" + mode);
                }
            } else if (type < 41) {
                switch (mode) {
                    case QRMode.MODE_NUMBER:
                        return 14;
                    case QRMode.MODE_ALPHA_NUM:
                        return 13;
                    case QRMode.MODE_8BIT_BYTE:
                        return 16;
                    case QRMode.MODE_KANJI:
                        return 12;
                    default:
                        throw new Error("mode:" + mode);
                }
            } else {
                throw new Error("type:" + type);
            }
        },
        getLostPoint: function (qrCode) {
            var moduleCount = qrCode.getModuleCount();
            var lostPoint = 0;
            for (var row = 0; row < moduleCount; row++) {
                for (var col = 0; col < moduleCount; col++) {
                    var sameCount = 0;
                    var dark = qrCode.isDark(row, col);
                    for (var r = -1; r <= 1; r++) {
                        if (row + r < 0 || moduleCount <= row + r) {
                            continue;
                        }
                        for (var c = -1; c <= 1; c++) {
                            if (col + c < 0 || moduleCount <= col + c) {
                                continue;
                            }
                            if (r == 0 && c == 0) {
                                continue;
                            }
                            if (dark == qrCode.isDark(row + r, col + c)) {
                                sameCount++;
                            }
                        }
                    }
                    if (sameCount > 5) {
                        lostPoint += (3 + sameCount - 5);
                    }
                }
            }
            for (var row = 0; row < moduleCount - 1; row++) {
                for (var col = 0; col < moduleCount - 1; col++) {
                    var count = 0;
                    if (qrCode.isDark(row, col)) count++;
                    if (qrCode.isDark(row + 1, col)) count++;
                    if (qrCode.isDark(row, col + 1)) count++;
                    if (qrCode.isDark(row + 1, col + 1)) count++;
                    if (count == 0 || count == 4) {
                        lostPoint += 3;
                    }
                }
            }
            for (var row = 0; row < moduleCount; row++) {
                for (var col = 0; col < moduleCount - 6; col++) {
                    if (qrCode.isDark(row, col) && !qrCode.isDark(row, col + 1) && qrCode.isDark(row, col + 2) && qrCode.isDark(row, col + 3) && qrCode.isDark(row, col + 4) && !qrCode.isDark(row, col + 5) && qrCode.isDark(row, col + 6)) {
                        lostPoint += 40;
                    }
                }
            }
            for (var col = 0; col < moduleCount; col++) {
                for (var row = 0; row < moduleCount - 6; row++) {
                    if (qrCode.isDark(row, col) && !qrCode.isDark(row + 1, col) && qrCode.isDark(row + 2, col) && qrCode.isDark(row + 3, col) && qrCode.isDark(row + 4, col) && !qrCode.isDark(row + 5, col) && qrCode.isDark(row + 6, col)) {
                        lostPoint += 40;
                    }
                }
            }
            var darkCount = 0;
            for (var col = 0; col < moduleCount; col++) {
                for (var row = 0; row < moduleCount; row++) {
                    if (qrCode.isDark(row, col)) {
                        darkCount++;
                    }
                }
            }
            var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
            lostPoint += ratio * 10;
            return lostPoint;
        }
    };
    var QRMath = {
        glog: function (n) {
            if (n < 1) {
                throw new Error("glog(" + n + ")");
            }
            return QRMath.LOG_TABLE[n];
        },
        gexp: function (n) {
            while (n < 0) {
                n += 255;
            }
            while (n >= 256) {
                n -= 255;
            }
            return QRMath.EXP_TABLE[n];
        },
        EXP_TABLE: new Array(256),
        LOG_TABLE: new Array(256)
    };
    for (var i = 0; i < 8; i++) {
        QRMath.EXP_TABLE[i] = 1 << i;
    }
    for (var i = 8; i < 256; i++) {
        QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
    }
    for (var i = 0; i < 255; i++) {
        QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
    }

    function QRPolynomial(num, shift) {
        if (num.length == undefined) {
            throw new Error(num.length + "/" + shift);
        }
        var offset = 0;
        while (offset < num.length && num[offset] == 0) {
            offset++;
        }
        this.num = new Array(num.length - offset + shift);
        for (var i = 0; i < num.length - offset; i++) {
            this.num[i] = num[i + offset];
        }
    }
    QRPolynomial.prototype = {
        get: function (index) {
            return this.num[index];
        },
        getLength: function () {
            return this.num.length;
        },
        multiply: function (e) {
            var num = new Array(this.getLength() + e.getLength() - 1);
            for (var i = 0; i < this.getLength(); i++) {
                for (var j = 0; j < e.getLength(); j++) {
                    num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
                }
            }
            return new QRPolynomial(num, 0);
        },
        mod: function (e) {
            if (this.getLength() - e.getLength() < 0) {
                return this;
            }
            var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
            var num = new Array(this.getLength());
            for (var i = 0; i < this.getLength(); i++) {
                num[i] = this.get(i);
            }
            for (var i = 0; i < e.getLength(); i++) {
                num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
            }
            return new QRPolynomial(num, 0).mod(e);
        }
    };

    function QRRSBlock(totalCount, dataCount) {
        this.totalCount = totalCount;
        this.dataCount = dataCount;
    }
    QRRSBlock.RS_BLOCK_TABLE = [
        [1, 26, 19],
        [1, 26, 16],
        [1, 26, 13],
        [1, 26, 9],
        [1, 44, 34],
        [1, 44, 28],
        [1, 44, 22],
        [1, 44, 16],
        [1, 70, 55],
        [1, 70, 44],
        [2, 35, 17],
        [2, 35, 13],
        [1, 100, 80],
        [2, 50, 32],
        [2, 50, 24],
        [4, 25, 9],
        [1, 134, 108],
        [2, 67, 43],
        [2, 33, 15, 2, 34, 16],
        [2, 33, 11, 2, 34, 12],
        [2, 86, 68],
        [4, 43, 27],
        [4, 43, 19],
        [4, 43, 15],
        [2, 98, 78],
        [4, 49, 31],
        [2, 32, 14, 4, 33, 15],
        [4, 39, 13, 1, 40, 14],
        [2, 121, 97],
        [2, 60, 38, 2, 61, 39],
        [4, 40, 18, 2, 41, 19],
        [4, 40, 14, 2, 41, 15],
        [2, 146, 116],
        [3, 58, 36, 2, 59, 37],
        [4, 36, 16, 4, 37, 17],
        [4, 36, 12, 4, 37, 13],
        [2, 86, 68, 2, 87, 69],
        [4, 69, 43, 1, 70, 44],
        [6, 43, 19, 2, 44, 20],
        [6, 43, 15, 2, 44, 16],
        [4, 101, 81],
        [1, 80, 50, 4, 81, 51],
        [4, 50, 22, 4, 51, 23],
        [3, 36, 12, 8, 37, 13],
        [2, 116, 92, 2, 117, 93],
        [6, 58, 36, 2, 59, 37],
        [4, 46, 20, 6, 47, 21],
        [7, 42, 14, 4, 43, 15],
        [4, 133, 107],
        [8, 59, 37, 1, 60, 38],
        [8, 44, 20, 4, 45, 21],
        [12, 33, 11, 4, 34, 12],
        [3, 145, 115, 1, 146, 116],
        [4, 64, 40, 5, 65, 41],
        [11, 36, 16, 5, 37, 17],
        [11, 36, 12, 5, 37, 13],
        [5, 109, 87, 1, 110, 88],
        [5, 65, 41, 5, 66, 42],
        [5, 54, 24, 7, 55, 25],
        [11, 36, 12],
        [5, 122, 98, 1, 123, 99],
        [7, 73, 45, 3, 74, 46],
        [15, 43, 19, 2, 44, 20],
        [3, 45, 15, 13, 46, 16],
        [1, 135, 107, 5, 136, 108],
        [10, 74, 46, 1, 75, 47],
        [1, 50, 22, 15, 51, 23],
        [2, 42, 14, 17, 43, 15],
        [5, 150, 120, 1, 151, 121],
        [9, 69, 43, 4, 70, 44],
        [17, 50, 22, 1, 51, 23],
        [2, 42, 14, 19, 43, 15],
        [3, 141, 113, 4, 142, 114],
        [3, 70, 44, 11, 71, 45],
        [17, 47, 21, 4, 48, 22],
        [9, 39, 13, 16, 40, 14],
        [3, 135, 107, 5, 136, 108],
        [3, 67, 41, 13, 68, 42],
        [15, 54, 24, 5, 55, 25],
        [15, 43, 15, 10, 44, 16],
        [4, 144, 116, 4, 145, 117],
        [17, 68, 42],
        [17, 50, 22, 6, 51, 23],
        [19, 46, 16, 6, 47, 17],
        [2, 139, 111, 7, 140, 112],
        [17, 74, 46],
        [7, 54, 24, 16, 55, 25],
        [34, 37, 13],
        [4, 151, 121, 5, 152, 122],
        [4, 75, 47, 14, 76, 48],
        [11, 54, 24, 14, 55, 25],
        [16, 45, 15, 14, 46, 16],
        [6, 147, 117, 4, 148, 118],
        [6, 73, 45, 14, 74, 46],
        [11, 54, 24, 16, 55, 25],
        [30, 46, 16, 2, 47, 17],
        [8, 132, 106, 4, 133, 107],
        [8, 75, 47, 13, 76, 48],
        [7, 54, 24, 22, 55, 25],
        [22, 45, 15, 13, 46, 16],
        [10, 142, 114, 2, 143, 115],
        [19, 74, 46, 4, 75, 47],
        [28, 50, 22, 6, 51, 23],
        [33, 46, 16, 4, 47, 17],
        [8, 152, 122, 4, 153, 123],
        [22, 73, 45, 3, 74, 46],
        [8, 53, 23, 26, 54, 24],
        [12, 45, 15, 28, 46, 16],
        [3, 147, 117, 10, 148, 118],
        [3, 73, 45, 23, 74, 46],
        [4, 54, 24, 31, 55, 25],
        [11, 45, 15, 31, 46, 16],
        [7, 146, 116, 7, 147, 117],
        [21, 73, 45, 7, 74, 46],
        [1, 53, 23, 37, 54, 24],
        [19, 45, 15, 26, 46, 16],
        [5, 145, 115, 10, 146, 116],
        [19, 75, 47, 10, 76, 48],
        [15, 54, 24, 25, 55, 25],
        [23, 45, 15, 25, 46, 16],
        [13, 145, 115, 3, 146, 116],
        [2, 74, 46, 29, 75, 47],
        [42, 54, 24, 1, 55, 25],
        [23, 45, 15, 28, 46, 16],
        [17, 145, 115],
        [10, 74, 46, 23, 75, 47],
        [10, 54, 24, 35, 55, 25],
        [19, 45, 15, 35, 46, 16],
        [17, 145, 115, 1, 146, 116],
        [14, 74, 46, 21, 75, 47],
        [29, 54, 24, 19, 55, 25],
        [11, 45, 15, 46, 46, 16],
        [13, 145, 115, 6, 146, 116],
        [14, 74, 46, 23, 75, 47],
        [44, 54, 24, 7, 55, 25],
        [59, 46, 16, 1, 47, 17],
        [12, 151, 121, 7, 152, 122],
        [12, 75, 47, 26, 76, 48],
        [39, 54, 24, 14, 55, 25],
        [22, 45, 15, 41, 46, 16],
        [6, 151, 121, 14, 152, 122],
        [6, 75, 47, 34, 76, 48],
        [46, 54, 24, 10, 55, 25],
        [2, 45, 15, 64, 46, 16],
        [17, 152, 122, 4, 153, 123],
        [29, 74, 46, 14, 75, 47],
        [49, 54, 24, 10, 55, 25],
        [24, 45, 15, 46, 46, 16],
        [4, 152, 122, 18, 153, 123],
        [13, 74, 46, 32, 75, 47],
        [48, 54, 24, 14, 55, 25],
        [42, 45, 15, 32, 46, 16],
        [20, 147, 117, 4, 148, 118],
        [40, 75, 47, 7, 76, 48],
        [43, 54, 24, 22, 55, 25],
        [10, 45, 15, 67, 46, 16],
        [19, 148, 118, 6, 149, 119],
        [18, 75, 47, 31, 76, 48],
        [34, 54, 24, 34, 55, 25],
        [20, 45, 15, 61, 46, 16]
    ];
    QRRSBlock.getRSBlocks = function (typeNumber, errorCorrectLevel) {
        var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
        if (rsBlock == undefined) {
            throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
        }
        var length = rsBlock.length / 3;
        var list = [];
        for (var i = 0; i < length; i++) {
            var count = rsBlock[i * 3 + 0];
            var totalCount = rsBlock[i * 3 + 1];
            var dataCount = rsBlock[i * 3 + 2];
            for (var j = 0; j < count; j++) {
                list.push(new QRRSBlock(totalCount, dataCount));
            }
        }
        return list;
    };
    QRRSBlock.getRsBlockTable = function (typeNumber, errorCorrectLevel) {
        switch (errorCorrectLevel) {
            case QRErrorCorrectLevel.L:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
            case QRErrorCorrectLevel.M:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
            case QRErrorCorrectLevel.Q:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
            case QRErrorCorrectLevel.H:
                return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
            default:
                return undefined;
        }
    };

    function QRBitBuffer() {
        this.buffer = [];
        this.length = 0;
    }
    QRBitBuffer.prototype = {
        get: function (index) {
            var bufIndex = Math.floor(index / 8);
            return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) == 1;
        },
        put: function (num, length) {
            for (var i = 0; i < length; i++) {
                this.putBit(((num >>> (length - i - 1)) & 1) == 1);
            }
        },
        getLengthInBits: function () {
            return this.length;
        },
        putBit: function (bit) {
            var bufIndex = Math.floor(this.length / 8);
            if (this.buffer.length <= bufIndex) {
                this.buffer.push(0);
            }
            if (bit) {
                this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
            }
            this.length++;
        }
    };
    var QRCodeLimitLength = [
        [17, 14, 11, 7],
        [32, 26, 20, 14],
        [53, 42, 32, 24],
        [78, 62, 46, 34],
        [106, 84, 60, 44],
        [134, 106, 74, 58],
        [154, 122, 86, 64],
        [192, 152, 108, 84],
        [230, 180, 130, 98],
        [271, 213, 151, 119],
        [321, 251, 177, 137],
        [367, 287, 203, 155],
        [425, 331, 241, 177],
        [458, 362, 258, 194],
        [520, 412, 292, 220],
        [586, 450, 322, 250],
        [644, 504, 364, 280],
        [718, 560, 394, 310],
        [792, 624, 442, 338],
        [858, 666, 482, 382],
        [929, 711, 509, 403],
        [1003, 779, 565, 439],
        [1091, 857, 611, 461],
        [1171, 911, 661, 511],
        [1273, 997, 715, 535],
        [1367, 1059, 751, 593],
        [1465, 1125, 805, 625],
        [1528, 1190, 868, 658],
        [1628, 1264, 908, 698],
        [1732, 1370, 982, 742],
        [1840, 1452, 1030, 790],
        [1952, 1538, 1112, 842],
        [2068, 1628, 1168, 898],
        [2188, 1722, 1228, 958],
        [2303, 1809, 1283, 983],
        [2431, 1911, 1351, 1051],
        [2563, 1989, 1423, 1093],
        [2699, 2099, 1499, 1139],
        [2809, 2213, 1579, 1219],
        [2953, 2331, 1663, 1273]
    ];

    function _isSupportCanvas() {
        return typeof CanvasRenderingContext2D != "undefined";
    }

    function _getAndroid() {
        var android = false;
        var sAgent = navigator.userAgent;
        if (/android/i.test(sAgent)) {
            android = true;
            var aMat = sAgent.toString().match(/android ([0-9]\.[0-9])/i);
            if (aMat && aMat[1]) {
                android = parseFloat(aMat[1]);
            }
        }
        return android;
    }
    var svgDrawer = (function () {
        var Drawing = function (el, htOption) {
            this._el = el;
            this._htOption = htOption;
        };
        Drawing.prototype.draw = function (oQRCode) {
            var _htOption = this._htOption;
            var _el = this._el;
            var nCount = oQRCode.getModuleCount();
            var nWidth = Math.floor(_htOption.width / nCount);
            var nHeight = Math.floor(_htOption.height / nCount);
            this.clear();

            function makeSVG(tag, attrs) {
                var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
                for (var k in attrs)
                    if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
                return el;
            }
            var svg = makeSVG("svg", {
                'viewBox': '0 0 ' + String(nCount) + " " + String(nCount),
                'width': '100%',
                'height': '100%',
                'fill': _htOption.colorLight
            });
            svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
            _el.appendChild(svg);
            svg.appendChild(makeSVG("rect", {
                "fill": _htOption.colorLight,
                "width": "100%",
                "height": "100%"
            }));
            svg.appendChild(makeSVG("rect", {
                "fill": _htOption.colorDark,
                "width": "1",
                "height": "1",
                "id": "template"
            }));
            for (var row = 0; row < nCount; row++) {
                for (var col = 0; col < nCount; col++) {
                    if (oQRCode.isDark(row, col)) {
                        var child = makeSVG("use", {
                            "x": String(col),
                            "y": String(row)
                        });
                        child.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#template")
                        svg.appendChild(child);
                    }
                }
            }
        };
        Drawing.prototype.clear = function () {
            while (this._el.hasChildNodes())
                this._el.removeChild(this._el.lastChild);
        };
        return Drawing;
    })();
    var useSVG = document.documentElement.tagName.toLowerCase() === "svg";
    var Drawing = useSVG ? svgDrawer : !_isSupportCanvas() ? (function () {
        var Drawing = function (el, htOption) {
            this._el = el;
            this._htOption = htOption;
        };
        Drawing.prototype.draw = function (oQRCode) {
            var _htOption = this._htOption;
            var _el = this._el;
            var nCount = oQRCode.getModuleCount();
            var nWidth = Math.floor(_htOption.width / nCount);
            var nHeight = Math.floor(_htOption.height / nCount);
            var aHTML = ['<table style="border:0;border-collapse:collapse;">'];
            for (var row = 0; row < nCount; row++) {
                aHTML.push('<tr>');
                for (var col = 0; col < nCount; col++) {
                    aHTML.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:' + nWidth + 'px;height:' + nHeight + 'px;background-color:' + (oQRCode.isDark(row, col) ? _htOption.colorDark : _htOption.colorLight) + ';"></td>');
                }
                aHTML.push('</tr>');
            }
            aHTML.push('</table>');
            _el.innerHTML = aHTML.join('');
            var elTable = _el.childNodes[0];
            var nLeftMarginTable = (_htOption.width - elTable.offsetWidth) / 2;
            var nTopMarginTable = (_htOption.height - elTable.offsetHeight) / 2;
            if (nLeftMarginTable > 0 && nTopMarginTable > 0) {
                elTable.style.margin = nTopMarginTable + "px " + nLeftMarginTable + "px";
            }
        };
        Drawing.prototype.clear = function () {
            this._el.innerHTML = '';
        };
        return Drawing;
    })() : (function () {
        function _onMakeImage() {
            this._elImage.src = this._elCanvas.toDataURL("image/png");
            this._elImage.style.display = "block";
            this._elCanvas.style.display = "none";
        }
        if (this._android && this._android <= 2.1) {
            var factor = 1 / window.devicePixelRatio;
            var drawImage = CanvasRenderingContext2D.prototype.drawImage;
            CanvasRenderingContext2D.prototype.drawImage = function (image, sx, sy, sw, sh, dx, dy, dw, dh) {
                if (("nodeName" in image) && /img/i.test(image.nodeName)) {
                    for (var i = arguments.length - 1; i >= 1; i--) {
                        arguments[i] = arguments[i] * factor;
                    }
                } else if (typeof dw == "undefined") {
                    arguments[1] *= factor;
                    arguments[2] *= factor;
                    arguments[3] *= factor;
                    arguments[4] *= factor;
                }
                drawImage.apply(this, arguments);
            };
        }

        function _safeSetDataURI(fSuccess, fFail) {
            var self = this;
            self._fFail = fFail;
            self._fSuccess = fSuccess;
            if (self._bSupportDataURI === null) {
                var el = document.createElement("img");
                var fOnError = function () {
                    self._bSupportDataURI = false;
                    if (self._fFail) {
                        self._fFail.call(self);
                    }
                };
                var fOnSuccess = function () {
                    self._bSupportDataURI = true;
                    if (self._fSuccess) {
                        self._fSuccess.call(self);
                    }
                };
                el.onabort = fOnError;
                el.onerror = fOnError;
                el.onload = fOnSuccess;
                el.src = "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
                return;
            } else if (self._bSupportDataURI === true && self._fSuccess) {
                self._fSuccess.call(self);
            } else if (self._bSupportDataURI === false && self._fFail) {
                self._fFail.call(self);
            }
        };
        var Drawing = function (el, htOption) {
            this._bIsPainted = false;
            this._android = _getAndroid();
            this._htOption = htOption;
            this._elCanvas = document.createElement("canvas");
            this._elCanvas.width = htOption.width;
            this._elCanvas.height = htOption.height;
            el.appendChild(this._elCanvas);
            this._el = el;
            this._oContext = this._elCanvas.getContext("2d");
            this._bIsPainted = false;
            this._elImage = document.createElement("img");
            this._elImage.alt = "Scan me!";
            this._elImage.style.display = "none";
            this._el.appendChild(this._elImage);
            this._bSupportDataURI = null;
        };
        Drawing.prototype.draw = function (oQRCode) {
            var _elImage = this._elImage;
            var _oContext = this._oContext;
            var _htOption = this._htOption;
            var nCount = oQRCode.getModuleCount();
            var nWidth = _htOption.width / nCount;
            var nHeight = _htOption.height / nCount;
            var nRoundedWidth = Math.round(nWidth);
            var nRoundedHeight = Math.round(nHeight);
            _elImage.style.display = "none";
            this.clear();
            for (var row = 0; row < nCount; row++) {
                for (var col = 0; col < nCount; col++) {
                    var bIsDark = oQRCode.isDark(row, col);
                    var nLeft = col * nWidth;
                    var nTop = row * nHeight;
                    _oContext.strokeStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
                    _oContext.lineWidth = 1;
                    _oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
                    _oContext.fillRect(nLeft, nTop, nWidth, nHeight);
                    _oContext.strokeRect(Math.floor(nLeft) + 0.5, Math.floor(nTop) + 0.5, nRoundedWidth, nRoundedHeight);
                    _oContext.strokeRect(Math.ceil(nLeft) - 0.5, Math.ceil(nTop) - 0.5, nRoundedWidth, nRoundedHeight);
                }
            }
            this._bIsPainted = true;
        };
        Drawing.prototype.makeImage = function () {
            if (this._bIsPainted) {
                _safeSetDataURI.call(this, _onMakeImage);
            }
        };
        Drawing.prototype.isPainted = function () {
            return this._bIsPainted;
        };
        Drawing.prototype.clear = function () {
            this._oContext.clearRect(0, 0, this._elCanvas.width, this._elCanvas.height);
            this._bIsPainted = false;
        };
        Drawing.prototype.round = function (nNumber) {
            if (!nNumber) {
                return nNumber;
            }
            return Math.floor(nNumber * 1000) / 1000;
        };
        return Drawing;
    })();

    function _getTypeNumber(sText, nCorrectLevel) {
        var nType = 1;
        var length = _getUTF8Length(sText);
        for (var i = 0, len = QRCodeLimitLength.length; i <= len; i++) {
            var nLimit = 0;
            switch (nCorrectLevel) {
                case QRErrorCorrectLevel.L:
                    nLimit = QRCodeLimitLength[i][0];
                    break;
                case QRErrorCorrectLevel.M:
                    nLimit = QRCodeLimitLength[i][1];
                    break;
                case QRErrorCorrectLevel.Q:
                    nLimit = QRCodeLimitLength[i][2];
                    break;
                case QRErrorCorrectLevel.H:
                    nLimit = QRCodeLimitLength[i][3];
                    break;
            }
            if (length <= nLimit) {
                break;
            } else {
                nType++;
            }
        }
        if (nType > QRCodeLimitLength.length) {
            throw new Error("Too long data");
        }
        return nType;
    }

    function _getUTF8Length(sText) {
        var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');
        return replacedText.length + (replacedText.length != sText ? 3 : 0);
    }
    QRCode = function (el, vOption) {
        this._htOption = {
            width: 256,
            height: 256,
            typeNumber: 4,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRErrorCorrectLevel.H
        };
        if (typeof vOption === 'string') {
            vOption = {
                text: vOption
            };
        }
        if (vOption) {
            for (var i in vOption) {
                this._htOption[i] = vOption[i];
            }
        }
        if (typeof el == "string") {
            el = document.getElementById(el);
        }
        if (this._htOption.useSVG) {
            Drawing = svgDrawer;
        }
        this._android = _getAndroid();
        this._el = el;
        this._oQRCode = null;
        this._oDrawing = new Drawing(this._el, this._htOption);
        if (this._htOption.text) {
            this.makeCode(this._htOption.text);
        }
    };
    QRCode.prototype.makeCode = function (sText) {
        this._oQRCode = new QRCodeModel(_getTypeNumber(sText, this._htOption.correctLevel), this._htOption.correctLevel);
        this._oQRCode.addData(sText);
        this._oQRCode.make();
        this._el.title = sText;
        this._oDrawing.draw(this._oQRCode);
        this.makeImage();
    };
    QRCode.prototype.makeImage = function () {
        if (typeof this._oDrawing.makeImage == "function" && (!this._android || this._android >= 3)) {
            this._oDrawing.makeImage();
        }
    };
    QRCode.prototype.clear = function () {
        this._oDrawing.clear();
    };
    QRCode.CorrectLevel = QRErrorCorrectLevel;
})();;
(function ($) {
    'use strict'

    function safeAdd(x, y) {
        var lsw = (x & 0xffff) + (y & 0xffff)
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
        return (msw << 16) | (lsw & 0xffff)
    }

    function bitRotateLeft(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt))
    }

    function md5cmn(q, a, b, x, s, t) {
        return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
    }

    function md5ff(a, b, c, d, x, s, t) {
        return md5cmn((b & c) | (~b & d), a, b, x, s, t)
    }

    function md5gg(a, b, c, d, x, s, t) {
        return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
    }

    function md5hh(a, b, c, d, x, s, t) {
        return md5cmn(b ^ c ^ d, a, b, x, s, t)
    }

    function md5ii(a, b, c, d, x, s, t) {
        return md5cmn(c ^ (b | ~d), a, b, x, s, t)
    }

    function binlMD5(x, len) {
        x[len >> 5] |= 0x80 << (len % 32)
        x[((len + 64) >>> 9 << 4) + 14] = len
        var i
        var olda
        var oldb
        var oldc
        var oldd
        var a = 1732584193
        var b = -271733879
        var c = -1732584194
        var d = 271733878
        for (i = 0; i < x.length; i += 16) {
            olda = a
            oldb = b
            oldc = c
            oldd = d
            a = md5ff(a, b, c, d, x[i], 7, -680876936)
            d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
            c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
            b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
            a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
            d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
            c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
            b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
            a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
            d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
            c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
            b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
            a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
            d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
            c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
            b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)
            a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
            d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
            c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
            b = md5gg(b, c, d, a, x[i], 20, -373897302)
            a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
            d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
            c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
            b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
            a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
            d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
            c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
            b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
            a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
            d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
            c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
            b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)
            a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
            d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
            c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
            b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
            a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
            d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
            c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
            b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
            a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
            d = md5hh(d, a, b, c, x[i], 11, -358537222)
            c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
            b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
            a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
            d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
            c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
            b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)
            a = md5ii(a, b, c, d, x[i], 6, -198630844)
            d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
            c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
            b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
            a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
            d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
            c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
            b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
            a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
            d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
            c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
            b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
            a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
            d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
            c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
            b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)
            a = safeAdd(a, olda)
            b = safeAdd(b, oldb)
            c = safeAdd(c, oldc)
            d = safeAdd(d, oldd)
        }
        return [a, b, c, d]
    }

    function binl2rstr(input) {
        var i
        var output = ''
        var length32 = input.length * 32
        for (i = 0; i < length32; i += 8) {
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff)
        }
        return output
    }

    function rstr2binl(input) {
        var i
        var output = []
        output[(input.length >> 2) - 1] = undefined
        for (i = 0; i < output.length; i += 1) {
            output[i] = 0
        }
        var length8 = input.length * 8
        for (i = 0; i < length8; i += 8) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32)
        }
        return output
    }

    function rstrMD5(s) {
        return binl2rstr(binlMD5(rstr2binl(s), s.length * 8))
    }

    function rstrHMACMD5(key, data) {
        var i
        var bkey = rstr2binl(key)
        var ipad = []
        var opad = []
        var hash
        ipad[15] = opad[15] = undefined
        if (bkey.length > 16) {
            bkey = binlMD5(bkey, key.length * 8)
        }
        for (i = 0; i < 16; i += 1) {
            ipad[i] = bkey[i] ^ 0x36363636
            opad[i] = bkey[i] ^ 0x5c5c5c5c
        }
        hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
        return binl2rstr(binlMD5(opad.concat(hash), 512 + 128))
    }

    function rstr2hex(input) {
        var hexTab = '0123456789abcdef'
        var output = ''
        var x
        var i
        for (i = 0; i < input.length; i += 1) {
            x = input.charCodeAt(i)
            output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
        }
        return output
    }

    function str2rstrUTF8(input) {
        return unescape(encodeURIComponent(input))
    }

    function rawMD5(s) {
        return rstrMD5(str2rstrUTF8(s))
    }

    function hexMD5(s) {
        return rstr2hex(rawMD5(s))
    }

    function rawHMACMD5(k, d) {
        return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d))
    }

    function hexHMACMD5(k, d) {
        return rstr2hex(rawHMACMD5(k, d))
    }

    function md5(string, key, raw) {
        if (!key) {
            if (!raw) {
                return hexMD5(string)
            }
            return rawMD5(string)
        }
        if (!raw) {
            return hexHMACMD5(key, string)
        }
        return rawHMACMD5(key, string)
    }
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return md5
        })
    } else if (typeof module === 'object' && module.exports) {
        module.exports = md5
    } else {
        $.md5 = md5
    }
})(this);
(function () {
    'use strict';
    var INPUT_ERROR = 'input is invalid type';
    var FINALIZE_ERROR = 'finalize already called';
    var WINDOW = typeof window === 'object';
    var root = WINDOW ? window : {};
    if (root.JS_SHA512_NO_WINDOW) {
        WINDOW = false;
    }
    var WEB_WORKER = !WINDOW && typeof self === 'object';
    var NODE_JS = !root.JS_SHA512_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
    if (NODE_JS) {
        root = global;
    } else if (WEB_WORKER) {
        root = self;
    }
    var COMMON_JS = !root.JS_SHA512_NO_COMMON_JS && typeof module === 'object' && module.exports;
    var AMD = typeof define === 'function' && define.amd;
    var ARRAY_BUFFER = !root.JS_SHA512_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
    var HEX_CHARS = '0123456789abcdef'.split('');
    var EXTRA = [-2147483648, 8388608, 32768, 128];
    var SHIFT = [24, 16, 8, 0];
    var K = [0x428A2F98, 0xD728AE22, 0x71374491, 0x23EF65CD, 0xB5C0FBCF, 0xEC4D3B2F, 0xE9B5DBA5, 0x8189DBBC, 0x3956C25B, 0xF348B538, 0x59F111F1, 0xB605D019, 0x923F82A4, 0xAF194F9B, 0xAB1C5ED5, 0xDA6D8118, 0xD807AA98, 0xA3030242, 0x12835B01, 0x45706FBE, 0x243185BE, 0x4EE4B28C, 0x550C7DC3, 0xD5FFB4E2, 0x72BE5D74, 0xF27B896F, 0x80DEB1FE, 0x3B1696B1, 0x9BDC06A7, 0x25C71235, 0xC19BF174, 0xCF692694, 0xE49B69C1, 0x9EF14AD2, 0xEFBE4786, 0x384F25E3, 0x0FC19DC6, 0x8B8CD5B5, 0x240CA1CC, 0x77AC9C65, 0x2DE92C6F, 0x592B0275, 0x4A7484AA, 0x6EA6E483, 0x5CB0A9DC, 0xBD41FBD4, 0x76F988DA, 0x831153B5, 0x983E5152, 0xEE66DFAB, 0xA831C66D, 0x2DB43210, 0xB00327C8, 0x98FB213F, 0xBF597FC7, 0xBEEF0EE4, 0xC6E00BF3, 0x3DA88FC2, 0xD5A79147, 0x930AA725, 0x06CA6351, 0xE003826F, 0x14292967, 0x0A0E6E70, 0x27B70A85, 0x46D22FFC, 0x2E1B2138, 0x5C26C926, 0x4D2C6DFC, 0x5AC42AED, 0x53380D13, 0x9D95B3DF, 0x650A7354, 0x8BAF63DE, 0x766A0ABB, 0x3C77B2A8, 0x81C2C92E, 0x47EDAEE6, 0x92722C85, 0x1482353B, 0xA2BFE8A1, 0x4CF10364, 0xA81A664B, 0xBC423001, 0xC24B8B70, 0xD0F89791, 0xC76C51A3, 0x0654BE30, 0xD192E819, 0xD6EF5218, 0xD6990624, 0x5565A910, 0xF40E3585, 0x5771202A, 0x106AA070, 0x32BBD1B8, 0x19A4C116, 0xB8D2D0C8, 0x1E376C08, 0x5141AB53, 0x2748774C, 0xDF8EEB99, 0x34B0BCB5, 0xE19B48A8, 0x391C0CB3, 0xC5C95A63, 0x4ED8AA4A, 0xE3418ACB, 0x5B9CCA4F, 0x7763E373, 0x682E6FF3, 0xD6B2B8A3, 0x748F82EE, 0x5DEFB2FC, 0x78A5636F, 0x43172F60, 0x84C87814, 0xA1F0AB72, 0x8CC70208, 0x1A6439EC, 0x90BEFFFA, 0x23631E28, 0xA4506CEB, 0xDE82BDE9, 0xBEF9A3F7, 0xB2C67915, 0xC67178F2, 0xE372532B, 0xCA273ECE, 0xEA26619C, 0xD186B8C7, 0x21C0C207, 0xEADA7DD6, 0xCDE0EB1E, 0xF57D4F7F, 0xEE6ED178, 0x06F067AA, 0x72176FBA, 0x0A637DC5, 0xA2C898A6, 0x113F9804, 0xBEF90DAE, 0x1B710B35, 0x131C471B, 0x28DB77F5, 0x23047D84, 0x32CAAB7B, 0x40C72493, 0x3C9EBE0A, 0x15C9BEBC, 0x431D67C4, 0x9C100D4C, 0x4CC5D4BE, 0xCB3E42B6, 0x597F299C, 0xFC657E2A, 0x5FCB6FAB, 0x3AD6FAEC, 0x6C44198C, 0x4A475817];
    var OUTPUT_TYPES = ['hex', 'array', 'digest', 'arrayBuffer'];
    var blocks = [];
    if (root.JS_SHA512_NO_NODE_JS || !Array.isArray) {
        Array.isArray = function (obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        };
    }
    if (ARRAY_BUFFER && (root.JS_SHA512_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
        ArrayBuffer.isView = function (obj) {
            return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
        };
    }
    var createOutputMethod = function (outputType, bits) {
        return function (message) {
            return new Sha512(bits, true).update(message)[outputType]();
        };
    };
    var createMethod = function (bits) {
        var method = createOutputMethod('hex', bits);
        method.create = function () {
            return new Sha512(bits);
        };
        method.update = function (message) {
            return method.create().update(message);
        };
        for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
            var type = OUTPUT_TYPES[i];
            method[type] = createOutputMethod(type, bits);
        }
        return method;
    };
    var createHmacOutputMethod = function (outputType, bits) {
        return function (key, message) {
            return new HmacSha512(key, bits, true).update(message)[outputType]();
        };
    };
    var createHmacMethod = function (bits) {
        var method = createHmacOutputMethod('hex', bits);
        method.create = function (key) {
            return new HmacSha512(key, bits);
        };
        method.update = function (key, message) {
            return method.create(key).update(message);
        };
        for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
            var type = OUTPUT_TYPES[i];
            method[type] = createHmacOutputMethod(type, bits);
        }
        return method;
    };

    function Sha512(bits, sharedMemory) {
        if (sharedMemory) {
            blocks[0] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = blocks[16] = blocks[17] = blocks[18] = blocks[19] = blocks[20] = blocks[21] = blocks[22] = blocks[23] = blocks[24] = blocks[25] = blocks[26] = blocks[27] = blocks[28] = blocks[29] = blocks[30] = blocks[31] = blocks[32] = 0;
            this.blocks = blocks;
        } else {
            this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }
        if (bits == 384) {
            this.h0h = 0xCBBB9D5D;
            this.h0l = 0xC1059ED8;
            this.h1h = 0x629A292A;
            this.h1l = 0x367CD507;
            this.h2h = 0x9159015A;
            this.h2l = 0x3070DD17;
            this.h3h = 0x152FECD8;
            this.h3l = 0xF70E5939;
            this.h4h = 0x67332667;
            this.h4l = 0xFFC00B31;
            this.h5h = 0x8EB44A87;
            this.h5l = 0x68581511;
            this.h6h = 0xDB0C2E0D;
            this.h6l = 0x64F98FA7;
            this.h7h = 0x47B5481D;
            this.h7l = 0xBEFA4FA4;
        } else if (bits == 256) {
            this.h0h = 0x22312194;
            this.h0l = 0xFC2BF72C;
            this.h1h = 0x9F555FA3;
            this.h1l = 0xC84C64C2;
            this.h2h = 0x2393B86B;
            this.h2l = 0x6F53B151;
            this.h3h = 0x96387719;
            this.h3l = 0x5940EABD;
            this.h4h = 0x96283EE2;
            this.h4l = 0xA88EFFE3;
            this.h5h = 0xBE5E1E25;
            this.h5l = 0x53863992;
            this.h6h = 0x2B0199FC;
            this.h6l = 0x2C85B8AA;
            this.h7h = 0x0EB72DDC;
            this.h7l = 0x81C52CA2;
        } else if (bits == 224) {
            this.h0h = 0x8C3D37C8;
            this.h0l = 0x19544DA2;
            this.h1h = 0x73E19966;
            this.h1l = 0x89DCD4D6;
            this.h2h = 0x1DFAB7AE;
            this.h2l = 0x32FF9C82;
            this.h3h = 0x679DD514;
            this.h3l = 0x582F9FCF;
            this.h4h = 0x0F6D2B69;
            this.h4l = 0x7BD44DA8;
            this.h5h = 0x77E36F73;
            this.h5l = 0x04C48942;
            this.h6h = 0x3F9D85A8;
            this.h6l = 0x6A1D36C8;
            this.h7h = 0x1112E6AD;
            this.h7l = 0x91D692A1;
        } else {
            this.h0h = 0x6A09E667;
            this.h0l = 0xF3BCC908;
            this.h1h = 0xBB67AE85;
            this.h1l = 0x84CAA73B;
            this.h2h = 0x3C6EF372;
            this.h2l = 0xFE94F82B;
            this.h3h = 0xA54FF53A;
            this.h3l = 0x5F1D36F1;
            this.h4h = 0x510E527F;
            this.h4l = 0xADE682D1;
            this.h5h = 0x9B05688C;
            this.h5l = 0x2B3E6C1F;
            this.h6h = 0x1F83D9AB;
            this.h6l = 0xFB41BD6B;
            this.h7h = 0x5BE0CD19;
            this.h7l = 0x137E2179;
        }
        this.bits = bits;
        this.block = this.start = this.bytes = this.hBytes = 0;
        this.finalized = this.hashed = false;
    }
    Sha512.prototype.update = function (message) {
        if (this.finalized) {
            throw new Error(FINALIZE_ERROR);
        }
        var notString, type = typeof message;
        if (type !== 'string') {
            if (type === 'object') {
                if (message === null) {
                    throw new Error(INPUT_ERROR);
                } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
                    message = new Uint8Array(message);
                } else if (!Array.isArray(message)) {
                    if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
                        throw new Error(INPUT_ERROR);
                    }
                }
            } else {
                throw new Error(INPUT_ERROR);
            }
            notString = true;
        }
        var code, index = 0,
            i, length = message.length,
            blocks = this.blocks;
        while (index < length) {
            if (this.hashed) {
                this.hashed = false;
                blocks[0] = this.block;
                blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = blocks[16] = blocks[17] = blocks[18] = blocks[19] = blocks[20] = blocks[21] = blocks[22] = blocks[23] = blocks[24] = blocks[25] = blocks[26] = blocks[27] = blocks[28] = blocks[29] = blocks[30] = blocks[31] = blocks[32] = 0;
            }
            if (notString) {
                for (i = this.start; index < length && i < 128; ++index) {
                    blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
                }
            } else {
                for (i = this.start; index < length && i < 128; ++index) {
                    code = message.charCodeAt(index);
                    if (code < 0x80) {
                        blocks[i >> 2] |= code << SHIFT[i++ & 3];
                    } else if (code < 0x800) {
                        blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                    } else if (code < 0xd800 || code >= 0xe000) {
                        blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                    } else {
                        code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
                        blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                    }
                }
            }
            this.lastByteIndex = i;
            this.bytes += i - this.start;
            if (i >= 128) {
                this.block = blocks[32];
                this.start = i - 128;
                this.hash();
                this.hashed = true;
            } else {
                this.start = i;
            }
        }
        if (this.bytes > 4294967295) {
            this.hBytes += this.bytes / 4294967296 << 0;
            this.bytes = this.bytes % 4294967296;
        }
        return this;
    };
    Sha512.prototype.finalize = function () {
        if (this.finalized) {
            return;
        }
        this.finalized = true;
        var blocks = this.blocks,
            i = this.lastByteIndex;
        blocks[32] = this.block;
        blocks[i >> 2] |= EXTRA[i & 3];
        this.block = blocks[32];
        if (i >= 112) {
            if (!this.hashed) {
                this.hash();
            }
            blocks[0] = this.block;
            blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = blocks[16] = blocks[17] = blocks[18] = blocks[19] = blocks[20] = blocks[21] = blocks[22] = blocks[23] = blocks[24] = blocks[25] = blocks[26] = blocks[27] = blocks[28] = blocks[29] = blocks[30] = blocks[31] = blocks[32] = 0;
        }
        blocks[30] = this.hBytes << 3 | this.bytes >>> 29;
        blocks[31] = this.bytes << 3;
        this.hash();
    };
    Sha512.prototype.hash = function () {
        var h0h = this.h0h,
            h0l = this.h0l,
            h1h = this.h1h,
            h1l = this.h1l,
            h2h = this.h2h,
            h2l = this.h2l,
            h3h = this.h3h,
            h3l = this.h3l,
            h4h = this.h4h,
            h4l = this.h4l,
            h5h = this.h5h,
            h5l = this.h5l,
            h6h = this.h6h,
            h6l = this.h6l,
            h7h = this.h7h,
            h7l = this.h7l,
            blocks = this.blocks,
            j, s0h, s0l, s1h, s1l, c1, c2, c3, c4, abh, abl, dah, dal, cdh, cdl, bch, bcl, majh, majl, t1h, t1l, t2h, t2l, chh, chl;
        for (j = 32; j < 160; j += 2) {
            t1h = blocks[j - 30];
            t1l = blocks[j - 29];
            s0h = ((t1h >>> 1) | (t1l << 31)) ^ ((t1h >>> 8) | (t1l << 24)) ^ (t1h >>> 7);
            s0l = ((t1l >>> 1) | (t1h << 31)) ^ ((t1l >>> 8) | (t1h << 24)) ^ ((t1l >>> 7) | t1h << 25);
            t1h = blocks[j - 4];
            t1l = blocks[j - 3];
            s1h = ((t1h >>> 19) | (t1l << 13)) ^ ((t1l >>> 29) | (t1h << 3)) ^ (t1h >>> 6);
            s1l = ((t1l >>> 19) | (t1h << 13)) ^ ((t1h >>> 29) | (t1l << 3)) ^ ((t1l >>> 6) | t1h << 26);
            t1h = blocks[j - 32];
            t1l = blocks[j - 31];
            t2h = blocks[j - 14];
            t2l = blocks[j - 13];
            c1 = (t2l & 0xFFFF) + (t1l & 0xFFFF) + (s0l & 0xFFFF) + (s1l & 0xFFFF);
            c2 = (t2l >>> 16) + (t1l >>> 16) + (s0l >>> 16) + (s1l >>> 16) + (c1 >>> 16);
            c3 = (t2h & 0xFFFF) + (t1h & 0xFFFF) + (s0h & 0xFFFF) + (s1h & 0xFFFF) + (c2 >>> 16);
            c4 = (t2h >>> 16) + (t1h >>> 16) + (s0h >>> 16) + (s1h >>> 16) + (c3 >>> 16);
            blocks[j] = (c4 << 16) | (c3 & 0xFFFF);
            blocks[j + 1] = (c2 << 16) | (c1 & 0xFFFF);
        }
        var ah = h0h,
            al = h0l,
            bh = h1h,
            bl = h1l,
            ch = h2h,
            cl = h2l,
            dh = h3h,
            dl = h3l,
            eh = h4h,
            el = h4l,
            fh = h5h,
            fl = h5l,
            gh = h6h,
            gl = h6l,
            hh = h7h,
            hl = h7l;
        bch = bh & ch;
        bcl = bl & cl;
        for (j = 0; j < 160; j += 8) {
            s0h = ((ah >>> 28) | (al << 4)) ^ ((al >>> 2) | (ah << 30)) ^ ((al >>> 7) | (ah << 25));
            s0l = ((al >>> 28) | (ah << 4)) ^ ((ah >>> 2) | (al << 30)) ^ ((ah >>> 7) | (al << 25));
            s1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((el >>> 9) | (eh << 23));
            s1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((eh >>> 9) | (el << 23));
            abh = ah & bh;
            abl = al & bl;
            majh = abh ^ (ah & ch) ^ bch;
            majl = abl ^ (al & cl) ^ bcl;
            chh = (eh & fh) ^ (~eh & gh);
            chl = (el & fl) ^ (~el & gl);
            t1h = blocks[j];
            t1l = blocks[j + 1];
            t2h = K[j];
            t2l = K[j + 1];
            c1 = (t2l & 0xFFFF) + (t1l & 0xFFFF) + (chl & 0xFFFF) + (s1l & 0xFFFF) + (hl & 0xFFFF);
            c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (hl >>> 16) + (c1 >>> 16);
            c3 = (t2h & 0xFFFF) + (t1h & 0xFFFF) + (chh & 0xFFFF) + (s1h & 0xFFFF) + (hh & 0xFFFF) + (c2 >>> 16);
            c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (hh >>> 16) + (c3 >>> 16);
            t1h = (c4 << 16) | (c3 & 0xFFFF);
            t1l = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (majl & 0xFFFF) + (s0l & 0xFFFF);
            c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
            c3 = (majh & 0xFFFF) + (s0h & 0xFFFF) + (c2 >>> 16);
            c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
            t2h = (c4 << 16) | (c3 & 0xFFFF);
            t2l = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (dl & 0xFFFF) + (t1l & 0xFFFF);
            c2 = (dl >>> 16) + (t1l >>> 16) + (c1 >>> 16);
            c3 = (dh & 0xFFFF) + (t1h & 0xFFFF) + (c2 >>> 16);
            c4 = (dh >>> 16) + (t1h >>> 16) + (c3 >>> 16);
            hh = (c4 << 16) | (c3 & 0xFFFF);
            hl = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (t2l & 0xFFFF) + (t1l & 0xFFFF);
            c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
            c3 = (t2h & 0xFFFF) + (t1h & 0xFFFF) + (c2 >>> 16);
            c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
            dh = (c4 << 16) | (c3 & 0xFFFF);
            dl = (c2 << 16) | (c1 & 0xFFFF);
            s0h = ((dh >>> 28) | (dl << 4)) ^ ((dl >>> 2) | (dh << 30)) ^ ((dl >>> 7) | (dh << 25));
            s0l = ((dl >>> 28) | (dh << 4)) ^ ((dh >>> 2) | (dl << 30)) ^ ((dh >>> 7) | (dl << 25));
            s1h = ((hh >>> 14) | (hl << 18)) ^ ((hh >>> 18) | (hl << 14)) ^ ((hl >>> 9) | (hh << 23));
            s1l = ((hl >>> 14) | (hh << 18)) ^ ((hl >>> 18) | (hh << 14)) ^ ((hh >>> 9) | (hl << 23));
            dah = dh & ah;
            dal = dl & al;
            majh = dah ^ (dh & bh) ^ abh;
            majl = dal ^ (dl & bl) ^ abl;
            chh = (hh & eh) ^ (~hh & fh);
            chl = (hl & el) ^ (~hl & fl);
            t1h = blocks[j + 2];
            t1l = blocks[j + 3];
            t2h = K[j + 2];
            t2l = K[j + 3];
            c1 = (t2l & 0xFFFF) + (t1l & 0xFFFF) + (chl & 0xFFFF) + (s1l & 0xFFFF) + (gl & 0xFFFF);
            c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (gl >>> 16) + (c1 >>> 16);
            c3 = (t2h & 0xFFFF) + (t1h & 0xFFFF) + (chh & 0xFFFF) + (s1h & 0xFFFF) + (gh & 0xFFFF) + (c2 >>> 16);
            c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (gh >>> 16) + (c3 >>> 16);
            t1h = (c4 << 16) | (c3 & 0xFFFF);
            t1l = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (majl & 0xFFFF) + (s0l & 0xFFFF);
            c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
            c3 = (majh & 0xFFFF) + (s0h & 0xFFFF) + (c2 >>> 16);
            c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
            t2h = (c4 << 16) | (c3 & 0xFFFF);
            t2l = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (cl & 0xFFFF) + (t1l & 0xFFFF);
            c2 = (cl >>> 16) + (t1l >>> 16) + (c1 >>> 16);
            c3 = (ch & 0xFFFF) + (t1h & 0xFFFF) + (c2 >>> 16);
            c4 = (ch >>> 16) + (t1h >>> 16) + (c3 >>> 16);
            gh = (c4 << 16) | (c3 & 0xFFFF);
            gl = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (t2l & 0xFFFF) + (t1l & 0xFFFF);
            c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
            c3 = (t2h & 0xFFFF) + (t1h & 0xFFFF) + (c2 >>> 16);
            c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
            ch = (c4 << 16) | (c3 & 0xFFFF);
            cl = (c2 << 16) | (c1 & 0xFFFF);
            s0h = ((ch >>> 28) | (cl << 4)) ^ ((cl >>> 2) | (ch << 30)) ^ ((cl >>> 7) | (ch << 25));
            s0l = ((cl >>> 28) | (ch << 4)) ^ ((ch >>> 2) | (cl << 30)) ^ ((ch >>> 7) | (cl << 25));
            s1h = ((gh >>> 14) | (gl << 18)) ^ ((gh >>> 18) | (gl << 14)) ^ ((gl >>> 9) | (gh << 23));
            s1l = ((gl >>> 14) | (gh << 18)) ^ ((gl >>> 18) | (gh << 14)) ^ ((gh >>> 9) | (gl << 23));
            cdh = ch & dh;
            cdl = cl & dl;
            majh = cdh ^ (ch & ah) ^ dah;
            majl = cdl ^ (cl & al) ^ dal;
            chh = (gh & hh) ^ (~gh & eh);
            chl = (gl & hl) ^ (~gl & el);
            t1h = blocks[j + 4];
            t1l = blocks[j + 5];
            t2h = K[j + 4];
            t2l = K[j + 5];
            c1 = (t2l & 0xFFFF) + (t1l & 0xFFFF) + (chl & 0xFFFF) + (s1l & 0xFFFF) + (fl & 0xFFFF);
            c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (fl >>> 16) + (c1 >>> 16);
            c3 = (t2h & 0xFFFF) + (t1h & 0xFFFF) + (chh & 0xFFFF) + (s1h & 0xFFFF) + (fh & 0xFFFF) + (c2 >>> 16);
            c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (fh >>> 16) + (c3 >>> 16);
            t1h = (c4 << 16) | (c3 & 0xFFFF);
            t1l = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (majl & 0xFFFF) + (s0l & 0xFFFF);
            c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
            c3 = (majh & 0xFFFF) + (s0h & 0xFFFF) + (c2 >>> 16);
            c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
            t2h = (c4 << 16) | (c3 & 0xFFFF);
            t2l = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (bl & 0xFFFF) + (t1l & 0xFFFF);
            c2 = (bl >>> 16) + (t1l >>> 16) + (c1 >>> 16);
            c3 = (bh & 0xFFFF) + (t1h & 0xFFFF) + (c2 >>> 16);
            c4 = (bh >>> 16) + (t1h >>> 16) + (c3 >>> 16);
            fh = (c4 << 16) | (c3 & 0xFFFF);
            fl = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (t2l & 0xFFFF) + (t1l & 0xFFFF);
            c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
            c3 = (t2h & 0xFFFF) + (t1h & 0xFFFF) + (c2 >>> 16);
            c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
            bh = (c4 << 16) | (c3 & 0xFFFF);
            bl = (c2 << 16) | (c1 & 0xFFFF);
            s0h = ((bh >>> 28) | (bl << 4)) ^ ((bl >>> 2) | (bh << 30)) ^ ((bl >>> 7) | (bh << 25));
            s0l = ((bl >>> 28) | (bh << 4)) ^ ((bh >>> 2) | (bl << 30)) ^ ((bh >>> 7) | (bl << 25));
            s1h = ((fh >>> 14) | (fl << 18)) ^ ((fh >>> 18) | (fl << 14)) ^ ((fl >>> 9) | (fh << 23));
            s1l = ((fl >>> 14) | (fh << 18)) ^ ((fl >>> 18) | (fh << 14)) ^ ((fh >>> 9) | (fl << 23));
            bch = bh & ch;
            bcl = bl & cl;
            majh = bch ^ (bh & dh) ^ cdh;
            majl = bcl ^ (bl & dl) ^ cdl;
            chh = (fh & gh) ^ (~fh & hh);
            chl = (fl & gl) ^ (~fl & hl);
            t1h = blocks[j + 6];
            t1l = blocks[j + 7];
            t2h = K[j + 6];
            t2l = K[j + 7];
            c1 = (t2l & 0xFFFF) + (t1l & 0xFFFF) + (chl & 0xFFFF) + (s1l & 0xFFFF) + (el & 0xFFFF);
            c2 = (t2l >>> 16) + (t1l >>> 16) + (chl >>> 16) + (s1l >>> 16) + (el >>> 16) + (c1 >>> 16);
            c3 = (t2h & 0xFFFF) + (t1h & 0xFFFF) + (chh & 0xFFFF) + (s1h & 0xFFFF) + (eh & 0xFFFF) + (c2 >>> 16);
            c4 = (t2h >>> 16) + (t1h >>> 16) + (chh >>> 16) + (s1h >>> 16) + (eh >>> 16) + (c3 >>> 16);
            t1h = (c4 << 16) | (c3 & 0xFFFF);
            t1l = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (majl & 0xFFFF) + (s0l & 0xFFFF);
            c2 = (majl >>> 16) + (s0l >>> 16) + (c1 >>> 16);
            c3 = (majh & 0xFFFF) + (s0h & 0xFFFF) + (c2 >>> 16);
            c4 = (majh >>> 16) + (s0h >>> 16) + (c3 >>> 16);
            t2h = (c4 << 16) | (c3 & 0xFFFF);
            t2l = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (al & 0xFFFF) + (t1l & 0xFFFF);
            c2 = (al >>> 16) + (t1l >>> 16) + (c1 >>> 16);
            c3 = (ah & 0xFFFF) + (t1h & 0xFFFF) + (c2 >>> 16);
            c4 = (ah >>> 16) + (t1h >>> 16) + (c3 >>> 16);
            eh = (c4 << 16) | (c3 & 0xFFFF);
            el = (c2 << 16) | (c1 & 0xFFFF);
            c1 = (t2l & 0xFFFF) + (t1l & 0xFFFF);
            c2 = (t2l >>> 16) + (t1l >>> 16) + (c1 >>> 16);
            c3 = (t2h & 0xFFFF) + (t1h & 0xFFFF) + (c2 >>> 16);
            c4 = (t2h >>> 16) + (t1h >>> 16) + (c3 >>> 16);
            ah = (c4 << 16) | (c3 & 0xFFFF);
            al = (c2 << 16) | (c1 & 0xFFFF);
        }
        c1 = (h0l & 0xFFFF) + (al & 0xFFFF);
        c2 = (h0l >>> 16) + (al >>> 16) + (c1 >>> 16);
        c3 = (h0h & 0xFFFF) + (ah & 0xFFFF) + (c2 >>> 16);
        c4 = (h0h >>> 16) + (ah >>> 16) + (c3 >>> 16);
        this.h0h = (c4 << 16) | (c3 & 0xFFFF);
        this.h0l = (c2 << 16) | (c1 & 0xFFFF);
        c1 = (h1l & 0xFFFF) + (bl & 0xFFFF);
        c2 = (h1l >>> 16) + (bl >>> 16) + (c1 >>> 16);
        c3 = (h1h & 0xFFFF) + (bh & 0xFFFF) + (c2 >>> 16);
        c4 = (h1h >>> 16) + (bh >>> 16) + (c3 >>> 16);
        this.h1h = (c4 << 16) | (c3 & 0xFFFF);
        this.h1l = (c2 << 16) | (c1 & 0xFFFF);
        c1 = (h2l & 0xFFFF) + (cl & 0xFFFF);
        c2 = (h2l >>> 16) + (cl >>> 16) + (c1 >>> 16);
        c3 = (h2h & 0xFFFF) + (ch & 0xFFFF) + (c2 >>> 16);
        c4 = (h2h >>> 16) + (ch >>> 16) + (c3 >>> 16);
        this.h2h = (c4 << 16) | (c3 & 0xFFFF);
        this.h2l = (c2 << 16) | (c1 & 0xFFFF);
        c1 = (h3l & 0xFFFF) + (dl & 0xFFFF);
        c2 = (h3l >>> 16) + (dl >>> 16) + (c1 >>> 16);
        c3 = (h3h & 0xFFFF) + (dh & 0xFFFF) + (c2 >>> 16);
        c4 = (h3h >>> 16) + (dh >>> 16) + (c3 >>> 16);
        this.h3h = (c4 << 16) | (c3 & 0xFFFF);
        this.h3l = (c2 << 16) | (c1 & 0xFFFF);
        c1 = (h4l & 0xFFFF) + (el & 0xFFFF);
        c2 = (h4l >>> 16) + (el >>> 16) + (c1 >>> 16);
        c3 = (h4h & 0xFFFF) + (eh & 0xFFFF) + (c2 >>> 16);
        c4 = (h4h >>> 16) + (eh >>> 16) + (c3 >>> 16);
        this.h4h = (c4 << 16) | (c3 & 0xFFFF);
        this.h4l = (c2 << 16) | (c1 & 0xFFFF);
        c1 = (h5l & 0xFFFF) + (fl & 0xFFFF);
        c2 = (h5l >>> 16) + (fl >>> 16) + (c1 >>> 16);
        c3 = (h5h & 0xFFFF) + (fh & 0xFFFF) + (c2 >>> 16);
        c4 = (h5h >>> 16) + (fh >>> 16) + (c3 >>> 16);
        this.h5h = (c4 << 16) | (c3 & 0xFFFF);
        this.h5l = (c2 << 16) | (c1 & 0xFFFF);
        c1 = (h6l & 0xFFFF) + (gl & 0xFFFF);
        c2 = (h6l >>> 16) + (gl >>> 16) + (c1 >>> 16);
        c3 = (h6h & 0xFFFF) + (gh & 0xFFFF) + (c2 >>> 16);
        c4 = (h6h >>> 16) + (gh >>> 16) + (c3 >>> 16);
        this.h6h = (c4 << 16) | (c3 & 0xFFFF);
        this.h6l = (c2 << 16) | (c1 & 0xFFFF);
        c1 = (h7l & 0xFFFF) + (hl & 0xFFFF);
        c2 = (h7l >>> 16) + (hl >>> 16) + (c1 >>> 16);
        c3 = (h7h & 0xFFFF) + (hh & 0xFFFF) + (c2 >>> 16);
        c4 = (h7h >>> 16) + (hh >>> 16) + (c3 >>> 16);
        this.h7h = (c4 << 16) | (c3 & 0xFFFF);
        this.h7l = (c2 << 16) | (c1 & 0xFFFF);
    };
    Sha512.prototype.hex = function () {
        this.finalize();
        var h0h = this.h0h,
            h0l = this.h0l,
            h1h = this.h1h,
            h1l = this.h1l,
            h2h = this.h2h,
            h2l = this.h2l,
            h3h = this.h3h,
            h3l = this.h3l,
            h4h = this.h4h,
            h4l = this.h4l,
            h5h = this.h5h,
            h5l = this.h5l,
            h6h = this.h6h,
            h6l = this.h6l,
            h7h = this.h7h,
            h7l = this.h7l,
            bits = this.bits;
        var hex = HEX_CHARS[(h0h >> 28) & 0x0F] + HEX_CHARS[(h0h >> 24) & 0x0F] +
            HEX_CHARS[(h0h >> 20) & 0x0F] + HEX_CHARS[(h0h >> 16) & 0x0F] +
            HEX_CHARS[(h0h >> 12) & 0x0F] + HEX_CHARS[(h0h >> 8) & 0x0F] +
            HEX_CHARS[(h0h >> 4) & 0x0F] + HEX_CHARS[h0h & 0x0F] +
            HEX_CHARS[(h0l >> 28) & 0x0F] + HEX_CHARS[(h0l >> 24) & 0x0F] +
            HEX_CHARS[(h0l >> 20) & 0x0F] + HEX_CHARS[(h0l >> 16) & 0x0F] +
            HEX_CHARS[(h0l >> 12) & 0x0F] + HEX_CHARS[(h0l >> 8) & 0x0F] +
            HEX_CHARS[(h0l >> 4) & 0x0F] + HEX_CHARS[h0l & 0x0F] +
            HEX_CHARS[(h1h >> 28) & 0x0F] + HEX_CHARS[(h1h >> 24) & 0x0F] +
            HEX_CHARS[(h1h >> 20) & 0x0F] + HEX_CHARS[(h1h >> 16) & 0x0F] +
            HEX_CHARS[(h1h >> 12) & 0x0F] + HEX_CHARS[(h1h >> 8) & 0x0F] +
            HEX_CHARS[(h1h >> 4) & 0x0F] + HEX_CHARS[h1h & 0x0F] +
            HEX_CHARS[(h1l >> 28) & 0x0F] + HEX_CHARS[(h1l >> 24) & 0x0F] +
            HEX_CHARS[(h1l >> 20) & 0x0F] + HEX_CHARS[(h1l >> 16) & 0x0F] +
            HEX_CHARS[(h1l >> 12) & 0x0F] + HEX_CHARS[(h1l >> 8) & 0x0F] +
            HEX_CHARS[(h1l >> 4) & 0x0F] + HEX_CHARS[h1l & 0x0F] +
            HEX_CHARS[(h2h >> 28) & 0x0F] + HEX_CHARS[(h2h >> 24) & 0x0F] +
            HEX_CHARS[(h2h >> 20) & 0x0F] + HEX_CHARS[(h2h >> 16) & 0x0F] +
            HEX_CHARS[(h2h >> 12) & 0x0F] + HEX_CHARS[(h2h >> 8) & 0x0F] +
            HEX_CHARS[(h2h >> 4) & 0x0F] + HEX_CHARS[h2h & 0x0F] +
            HEX_CHARS[(h2l >> 28) & 0x0F] + HEX_CHARS[(h2l >> 24) & 0x0F] +
            HEX_CHARS[(h2l >> 20) & 0x0F] + HEX_CHARS[(h2l >> 16) & 0x0F] +
            HEX_CHARS[(h2l >> 12) & 0x0F] + HEX_CHARS[(h2l >> 8) & 0x0F] +
            HEX_CHARS[(h2l >> 4) & 0x0F] + HEX_CHARS[h2l & 0x0F] +
            HEX_CHARS[(h3h >> 28) & 0x0F] + HEX_CHARS[(h3h >> 24) & 0x0F] +
            HEX_CHARS[(h3h >> 20) & 0x0F] + HEX_CHARS[(h3h >> 16) & 0x0F] +
            HEX_CHARS[(h3h >> 12) & 0x0F] + HEX_CHARS[(h3h >> 8) & 0x0F] +
            HEX_CHARS[(h3h >> 4) & 0x0F] + HEX_CHARS[h3h & 0x0F];
        if (bits >= 256) {
            hex += HEX_CHARS[(h3l >> 28) & 0x0F] + HEX_CHARS[(h3l >> 24) & 0x0F] +
                HEX_CHARS[(h3l >> 20) & 0x0F] + HEX_CHARS[(h3l >> 16) & 0x0F] +
                HEX_CHARS[(h3l >> 12) & 0x0F] + HEX_CHARS[(h3l >> 8) & 0x0F] +
                HEX_CHARS[(h3l >> 4) & 0x0F] + HEX_CHARS[h3l & 0x0F];
        }
        if (bits >= 384) {
            hex += HEX_CHARS[(h4h >> 28) & 0x0F] + HEX_CHARS[(h4h >> 24) & 0x0F] +
                HEX_CHARS[(h4h >> 20) & 0x0F] + HEX_CHARS[(h4h >> 16) & 0x0F] +
                HEX_CHARS[(h4h >> 12) & 0x0F] + HEX_CHARS[(h4h >> 8) & 0x0F] +
                HEX_CHARS[(h4h >> 4) & 0x0F] + HEX_CHARS[h4h & 0x0F] +
                HEX_CHARS[(h4l >> 28) & 0x0F] + HEX_CHARS[(h4l >> 24) & 0x0F] +
                HEX_CHARS[(h4l >> 20) & 0x0F] + HEX_CHARS[(h4l >> 16) & 0x0F] +
                HEX_CHARS[(h4l >> 12) & 0x0F] + HEX_CHARS[(h4l >> 8) & 0x0F] +
                HEX_CHARS[(h4l >> 4) & 0x0F] + HEX_CHARS[h4l & 0x0F] +
                HEX_CHARS[(h5h >> 28) & 0x0F] + HEX_CHARS[(h5h >> 24) & 0x0F] +
                HEX_CHARS[(h5h >> 20) & 0x0F] + HEX_CHARS[(h5h >> 16) & 0x0F] +
                HEX_CHARS[(h5h >> 12) & 0x0F] + HEX_CHARS[(h5h >> 8) & 0x0F] +
                HEX_CHARS[(h5h >> 4) & 0x0F] + HEX_CHARS[h5h & 0x0F] +
                HEX_CHARS[(h5l >> 28) & 0x0F] + HEX_CHARS[(h5l >> 24) & 0x0F] +
                HEX_CHARS[(h5l >> 20) & 0x0F] + HEX_CHARS[(h5l >> 16) & 0x0F] +
                HEX_CHARS[(h5l >> 12) & 0x0F] + HEX_CHARS[(h5l >> 8) & 0x0F] +
                HEX_CHARS[(h5l >> 4) & 0x0F] + HEX_CHARS[h5l & 0x0F];
        }
        if (bits == 512) {
            hex += HEX_CHARS[(h6h >> 28) & 0x0F] + HEX_CHARS[(h6h >> 24) & 0x0F] +
                HEX_CHARS[(h6h >> 20) & 0x0F] + HEX_CHARS[(h6h >> 16) & 0x0F] +
                HEX_CHARS[(h6h >> 12) & 0x0F] + HEX_CHARS[(h6h >> 8) & 0x0F] +
                HEX_CHARS[(h6h >> 4) & 0x0F] + HEX_CHARS[h6h & 0x0F] +
                HEX_CHARS[(h6l >> 28) & 0x0F] + HEX_CHARS[(h6l >> 24) & 0x0F] +
                HEX_CHARS[(h6l >> 20) & 0x0F] + HEX_CHARS[(h6l >> 16) & 0x0F] +
                HEX_CHARS[(h6l >> 12) & 0x0F] + HEX_CHARS[(h6l >> 8) & 0x0F] +
                HEX_CHARS[(h6l >> 4) & 0x0F] + HEX_CHARS[h6l & 0x0F] +
                HEX_CHARS[(h7h >> 28) & 0x0F] + HEX_CHARS[(h7h >> 24) & 0x0F] +
                HEX_CHARS[(h7h >> 20) & 0x0F] + HEX_CHARS[(h7h >> 16) & 0x0F] +
                HEX_CHARS[(h7h >> 12) & 0x0F] + HEX_CHARS[(h7h >> 8) & 0x0F] +
                HEX_CHARS[(h7h >> 4) & 0x0F] + HEX_CHARS[h7h & 0x0F] +
                HEX_CHARS[(h7l >> 28) & 0x0F] + HEX_CHARS[(h7l >> 24) & 0x0F] +
                HEX_CHARS[(h7l >> 20) & 0x0F] + HEX_CHARS[(h7l >> 16) & 0x0F] +
                HEX_CHARS[(h7l >> 12) & 0x0F] + HEX_CHARS[(h7l >> 8) & 0x0F] +
                HEX_CHARS[(h7l >> 4) & 0x0F] + HEX_CHARS[h7l & 0x0F];
        }
        return hex;
    };
    Sha512.prototype.toString = Sha512.prototype.hex;
    Sha512.prototype.digest = function () {
        this.finalize();
        var h0h = this.h0h,
            h0l = this.h0l,
            h1h = this.h1h,
            h1l = this.h1l,
            h2h = this.h2h,
            h2l = this.h2l,
            h3h = this.h3h,
            h3l = this.h3l,
            h4h = this.h4h,
            h4l = this.h4l,
            h5h = this.h5h,
            h5l = this.h5l,
            h6h = this.h6h,
            h6l = this.h6l,
            h7h = this.h7h,
            h7l = this.h7l,
            bits = this.bits;
        var arr = [(h0h >> 24) & 0xFF, (h0h >> 16) & 0xFF, (h0h >> 8) & 0xFF, h0h & 0xFF, (h0l >> 24) & 0xFF, (h0l >> 16) & 0xFF, (h0l >> 8) & 0xFF, h0l & 0xFF, (h1h >> 24) & 0xFF, (h1h >> 16) & 0xFF, (h1h >> 8) & 0xFF, h1h & 0xFF, (h1l >> 24) & 0xFF, (h1l >> 16) & 0xFF, (h1l >> 8) & 0xFF, h1l & 0xFF, (h2h >> 24) & 0xFF, (h2h >> 16) & 0xFF, (h2h >> 8) & 0xFF, h2h & 0xFF, (h2l >> 24) & 0xFF, (h2l >> 16) & 0xFF, (h2l >> 8) & 0xFF, h2l & 0xFF, (h3h >> 24) & 0xFF, (h3h >> 16) & 0xFF, (h3h >> 8) & 0xFF, h3h & 0xFF];
        if (bits >= 256) {
            arr.push((h3l >> 24) & 0xFF, (h3l >> 16) & 0xFF, (h3l >> 8) & 0xFF, h3l & 0xFF);
        }
        if (bits >= 384) {
            arr.push((h4h >> 24) & 0xFF, (h4h >> 16) & 0xFF, (h4h >> 8) & 0xFF, h4h & 0xFF, (h4l >> 24) & 0xFF, (h4l >> 16) & 0xFF, (h4l >> 8) & 0xFF, h4l & 0xFF, (h5h >> 24) & 0xFF, (h5h >> 16) & 0xFF, (h5h >> 8) & 0xFF, h5h & 0xFF, (h5l >> 24) & 0xFF, (h5l >> 16) & 0xFF, (h5l >> 8) & 0xFF, h5l & 0xFF);
        }
        if (bits == 512) {
            arr.push((h6h >> 24) & 0xFF, (h6h >> 16) & 0xFF, (h6h >> 8) & 0xFF, h6h & 0xFF, (h6l >> 24) & 0xFF, (h6l >> 16) & 0xFF, (h6l >> 8) & 0xFF, h6l & 0xFF, (h7h >> 24) & 0xFF, (h7h >> 16) & 0xFF, (h7h >> 8) & 0xFF, h7h & 0xFF, (h7l >> 24) & 0xFF, (h7l >> 16) & 0xFF, (h7l >> 8) & 0xFF, h7l & 0xFF);
        }
        return arr;
    };
    Sha512.prototype.array = Sha512.prototype.digest;
    Sha512.prototype.arrayBuffer = function () {
        this.finalize();
        var bits = this.bits;
        var buffer = new ArrayBuffer(bits / 8);
        var dataView = new DataView(buffer);
        dataView.setUint32(0, this.h0h);
        dataView.setUint32(4, this.h0l);
        dataView.setUint32(8, this.h1h);
        dataView.setUint32(12, this.h1l);
        dataView.setUint32(16, this.h2h);
        dataView.setUint32(20, this.h2l);
        dataView.setUint32(24, this.h3h);
        if (bits >= 256) {
            dataView.setUint32(28, this.h3l);
        }
        if (bits >= 384) {
            dataView.setUint32(32, this.h4h);
            dataView.setUint32(36, this.h4l);
            dataView.setUint32(40, this.h5h);
            dataView.setUint32(44, this.h5l);
        }
        if (bits == 512) {
            dataView.setUint32(48, this.h6h);
            dataView.setUint32(52, this.h6l);
            dataView.setUint32(56, this.h7h);
            dataView.setUint32(60, this.h7l);
        }
        return buffer;
    };
    Sha512.prototype.clone = function () {
        var hash = new Sha512(this.bits, false);
        this.copyTo(hash);
        return hash;
    };
    Sha512.prototype.copyTo = function (hash) {
        var i = 0,
            attrs = ['h0h', 'h0l', 'h1h', 'h1l', 'h2h', 'h2l', 'h3h', 'h3l', 'h4h', 'h4l', 'h5h', 'h5l', 'h6h', 'h6l', 'h7h', 'h7l', 'start', 'bytes', 'hBytes', 'finalized', 'hashed', 'lastByteIndex'];
        for (i = 0; i < attrs.length; ++i) {
            hash[attrs[i]] = this[attrs[i]];
        }
        for (i = 0; i < this.blocks.length; ++i) {
            hash.blocks[i] = this.blocks[i];
        }
    };

    function HmacSha512(key, bits, sharedMemory) {
        var notString, type = typeof key;
        if (type !== 'string') {
            if (type === 'object') {
                if (key === null) {
                    throw new Error(INPUT_ERROR);
                } else if (ARRAY_BUFFER && key.constructor === ArrayBuffer) {
                    key = new Uint8Array(key);
                } else if (!Array.isArray(key)) {
                    if (!ARRAY_BUFFER || !ArrayBuffer.isView(key)) {
                        throw new Error(INPUT_ERROR);
                    }
                }
            } else {
                throw new Error(INPUT_ERROR);
            }
            notString = true;
        }
        var length = key.length;
        if (!notString) {
            var bytes = [],
                length = key.length,
                index = 0,
                code;
            for (var i = 0; i < length; ++i) {
                code = key.charCodeAt(i);
                if (code < 0x80) {
                    bytes[index++] = code;
                } else if (code < 0x800) {
                    bytes[index++] = (0xc0 | (code >> 6));
                    bytes[index++] = (0x80 | (code & 0x3f));
                } else if (code < 0xd800 || code >= 0xe000) {
                    bytes[index++] = (0xe0 | (code >> 12));
                    bytes[index++] = (0x80 | ((code >> 6) & 0x3f));
                    bytes[index++] = (0x80 | (code & 0x3f));
                } else {
                    code = 0x10000 + (((code & 0x3ff) << 10) | (key.charCodeAt(++i) & 0x3ff));
                    bytes[index++] = (0xf0 | (code >> 18));
                    bytes[index++] = (0x80 | ((code >> 12) & 0x3f));
                    bytes[index++] = (0x80 | ((code >> 6) & 0x3f));
                    bytes[index++] = (0x80 | (code & 0x3f));
                }
            }
            key = bytes;
        }
        if (key.length > 128) {
            key = (new Sha512(bits, true)).update(key).array();
        }
        var oKeyPad = [],
            iKeyPad = [];
        for (var i = 0; i < 128; ++i) {
            var b = key[i] || 0;
            oKeyPad[i] = 0x5c ^ b;
            iKeyPad[i] = 0x36 ^ b;
        }
        Sha512.call(this, bits, sharedMemory);
        this.update(iKeyPad);
        this.oKeyPad = oKeyPad;
        this.inner = true;
        this.sharedMemory = sharedMemory;
    }
    HmacSha512.prototype = new Sha512();
    HmacSha512.prototype.finalize = function () {
        Sha512.prototype.finalize.call(this);
        if (this.inner) {
            this.inner = false;
            var innerHash = this.array();
            Sha512.call(this, this.bits, this.sharedMemory);
            this.update(this.oKeyPad);
            this.update(innerHash);
            Sha512.prototype.finalize.call(this);
        }
    };
    HmacSha512.prototype.clone = function () {
        var hash = new HmacSha512([], this.bits, false);
        this.copyTo(hash);
        hash.inner = this.inner;
        for (var i = 0; i < this.oKeyPad.length; ++i) {
            hash.oKeyPad[i] = this.oKeyPad[i];
        }
        return hash;
    };
    var exports = createMethod(512);
    exports.sha512 = exports;
    exports.sha384 = createMethod(384);
    exports.sha512_256 = createMethod(256);
    exports.sha512_224 = createMethod(224);
    exports.sha512.hmac = createHmacMethod(512);
    exports.sha384.hmac = createHmacMethod(384);
    exports.sha512_256.hmac = createHmacMethod(256);
    exports.sha512_224.hmac = createHmacMethod(224);
    if (COMMON_JS) {
        module.exports = exports;
    } else {
        root.sha512 = exports.sha512;
        root.sha384 = exports.sha384;
        root.sha512_256 = exports.sha512_256;
        root.sha512_224 = exports.sha512_224;
        if (AMD) {
            define(function () {
                return exports;
            });
        }
    }
})();
(function () {
    'use strict';
    var ERROR = 'input is invalid type';
    var WINDOW = typeof window === 'object';
    var root = WINDOW ? window : {};
    if (root.JS_SHA256_NO_WINDOW) {
        WINDOW = false;
    }
    var WEB_WORKER = !WINDOW && typeof self === 'object';
    var NODE_JS = !root.JS_SHA256_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
    if (NODE_JS) {
        root = global;
    } else if (WEB_WORKER) {
        root = self;
    }
    var COMMON_JS = !root.JS_SHA256_NO_COMMON_JS && typeof module === 'object' && module.exports;
    var AMD = typeof define === 'function' && define.amd;
    var ARRAY_BUFFER = !root.JS_SHA256_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
    var HEX_CHARS = '0123456789abcdef'.split('');
    var EXTRA = [-2147483648, 8388608, 32768, 128];
    var SHIFT = [24, 16, 8, 0];
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var OUTPUT_TYPES = ['hex', 'array', 'digest', 'arrayBuffer'];
    var blocks = [];
    if (root.JS_SHA256_NO_NODE_JS || !Array.isArray) {
        Array.isArray = function (obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        };
    }
    if (ARRAY_BUFFER && (root.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
        ArrayBuffer.isView = function (obj) {
            return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
        };
    }
    var createOutputMethod = function (outputType, is224) {
        return function (message) {
            return new Sha256(is224, true).update(message)[outputType]();
        };
    };
    var createMethod = function (is224) {
        var method = createOutputMethod('hex', is224);
        if (NODE_JS) {
            method = nodeWrap(method, is224);
        }
        method.create = function () {
            return new Sha256(is224);
        };
        method.update = function (message) {
            return method.create().update(message);
        };
        for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
            var type = OUTPUT_TYPES[i];
            method[type] = createOutputMethod(type, is224);
        }
        return method;
    };
    var nodeWrap = function (method, is224) {
        var crypto = eval("require('crypto')");
        var Buffer = eval("require('buffer').Buffer");
        var algorithm = is224 ? 'sha224' : 'sha256';
        var nodeMethod = function (message) {
            if (typeof message === 'string') {
                return crypto.createHash(algorithm).update(message, 'utf8').digest('hex');
            } else {
                if (message === null || message === undefined) {
                    throw new Error(ERROR);
                } else if (message.constructor === ArrayBuffer) {
                    message = new Uint8Array(message);
                }
            }
            if (Array.isArray(message) || ArrayBuffer.isView(message) || message.constructor === Buffer) {
                return crypto.createHash(algorithm).update(new Buffer(message)).digest('hex');
            } else {
                return method(message);
            }
        };
        return nodeMethod;
    };
    var createHmacOutputMethod = function (outputType, is224) {
        return function (key, message) {
            return new HmacSha256(key, is224, true).update(message)[outputType]();
        };
    };
    var createHmacMethod = function (is224) {
        var method = createHmacOutputMethod('hex', is224);
        method.create = function (key) {
            return new HmacSha256(key, is224);
        };
        method.update = function (key, message) {
            return method.create(key).update(message);
        };
        for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
            var type = OUTPUT_TYPES[i];
            method[type] = createHmacOutputMethod(type, is224);
        }
        return method;
    };

    function Sha256(is224, sharedMemory) {
        if (sharedMemory) {
            blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            this.blocks = blocks;
        } else {
            this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }
        if (is224) {
            this.h0 = 0xc1059ed8;
            this.h1 = 0x367cd507;
            this.h2 = 0x3070dd17;
            this.h3 = 0xf70e5939;
            this.h4 = 0xffc00b31;
            this.h5 = 0x68581511;
            this.h6 = 0x64f98fa7;
            this.h7 = 0xbefa4fa4;
        } else {
            this.h0 = 0x6a09e667;
            this.h1 = 0xbb67ae85;
            this.h2 = 0x3c6ef372;
            this.h3 = 0xa54ff53a;
            this.h4 = 0x510e527f;
            this.h5 = 0x9b05688c;
            this.h6 = 0x1f83d9ab;
            this.h7 = 0x5be0cd19;
        }
        this.block = this.start = this.bytes = this.hBytes = 0;
        this.finalized = this.hashed = false;
        this.first = true;
        this.is224 = is224;
    }
    Sha256.prototype.update = function (message) {
        if (this.finalized) {
            return;
        }
        var notString, type = typeof message;
        if (type !== 'string') {
            if (type === 'object') {
                if (message === null) {
                    throw new Error(ERROR);
                } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
                    message = new Uint8Array(message);
                } else if (!Array.isArray(message)) {
                    if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
                        throw new Error(ERROR);
                    }
                }
            } else {
                throw new Error(ERROR);
            }
            notString = true;
        }
        var code, index = 0,
            i, length = message.length,
            blocks = this.blocks;
        while (index < length) {
            if (this.hashed) {
                this.hashed = false;
                blocks[0] = this.block;
                blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            }
            if (notString) {
                for (i = this.start; index < length && i < 64; ++index) {
                    blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
                }
            } else {
                for (i = this.start; index < length && i < 64; ++index) {
                    code = message.charCodeAt(index);
                    if (code < 0x80) {
                        blocks[i >> 2] |= code << SHIFT[i++ & 3];
                    } else if (code < 0x800) {
                        blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                    } else if (code < 0xd800 || code >= 0xe000) {
                        blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                    } else {
                        code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
                        blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                    }
                }
            }
            this.lastByteIndex = i;
            this.bytes += i - this.start;
            if (i >= 64) {
                this.block = blocks[16];
                this.start = i - 64;
                this.hash();
                this.hashed = true;
            } else {
                this.start = i;
            }
        }
        if (this.bytes > 4294967295) {
            this.hBytes += this.bytes / 4294967296 << 0;
            this.bytes = this.bytes % 4294967296;
        }
        return this;
    };
    Sha256.prototype.finalize = function () {
        if (this.finalized) {
            return;
        }
        this.finalized = true;
        var blocks = this.blocks,
            i = this.lastByteIndex;
        blocks[16] = this.block;
        blocks[i >> 2] |= EXTRA[i & 3];
        this.block = blocks[16];
        if (i >= 56) {
            if (!this.hashed) {
                this.hash();
            }
            blocks[0] = this.block;
            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
        }
        blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
        blocks[15] = this.bytes << 3;
        this.hash();
    };
    Sha256.prototype.hash = function () {
        var a = this.h0,
            b = this.h1,
            c = this.h2,
            d = this.h3,
            e = this.h4,
            f = this.h5,
            g = this.h6,
            h = this.h7,
            blocks = this.blocks,
            j, s0, s1, maj, t1, t2, ch, ab, da, cd, bc;
        for (j = 16; j < 64; ++j) {
            t1 = blocks[j - 15];
            s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
            t1 = blocks[j - 2];
            s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
            blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
        }
        bc = b & c;
        for (j = 0; j < 64; j += 4) {
            if (this.first) {
                if (this.is224) {
                    ab = 300032;
                    t1 = blocks[0] - 1413257819;
                    h = t1 - 150054599 << 0;
                    d = t1 + 24177077 << 0;
                } else {
                    ab = 704751109;
                    t1 = blocks[0] - 210244248;
                    h = t1 - 1521486534 << 0;
                    d = t1 + 143694565 << 0;
                }
                this.first = false;
            } else {
                s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
                s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
                ab = a & b;
                maj = ab ^ (a & c) ^ bc;
                ch = (e & f) ^ (~e & g);
                t1 = h + s1 + ch + K[j] + blocks[j];
                t2 = s0 + maj;
                h = d + t1 << 0;
                d = t1 + t2 << 0;
            }
            s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10));
            s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7));
            da = d & a;
            maj = da ^ (d & b) ^ ab;
            ch = (h & e) ^ (~h & f);
            t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
            t2 = s0 + maj;
            g = c + t1 << 0;
            c = t1 + t2 << 0;
            s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10));
            s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7));
            cd = c & d;
            maj = cd ^ (c & a) ^ da;
            ch = (g & h) ^ (~g & e);
            t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
            t2 = s0 + maj;
            f = b + t1 << 0;
            b = t1 + t2 << 0;
            s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10));
            s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7));
            bc = b & c;
            maj = bc ^ (b & d) ^ cd;
            ch = (f & g) ^ (~f & h);
            t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
            t2 = s0 + maj;
            e = a + t1 << 0;
            a = t1 + t2 << 0;
        }
        this.h0 = this.h0 + a << 0;
        this.h1 = this.h1 + b << 0;
        this.h2 = this.h2 + c << 0;
        this.h3 = this.h3 + d << 0;
        this.h4 = this.h4 + e << 0;
        this.h5 = this.h5 + f << 0;
        this.h6 = this.h6 + g << 0;
        this.h7 = this.h7 + h << 0;
    };
    Sha256.prototype.hex = function () {
        this.finalize();
        var h0 = this.h0,
            h1 = this.h1,
            h2 = this.h2,
            h3 = this.h3,
            h4 = this.h4,
            h5 = this.h5,
            h6 = this.h6,
            h7 = this.h7;
        var hex = HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] +
            HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] +
            HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] +
            HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
            HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] +
            HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] +
            HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] +
            HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
            HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] +
            HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] +
            HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] +
            HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
            HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F] +
            HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] +
            HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] +
            HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
            HEX_CHARS[(h4 >> 28) & 0x0F] + HEX_CHARS[(h4 >> 24) & 0x0F] +
            HEX_CHARS[(h4 >> 20) & 0x0F] + HEX_CHARS[(h4 >> 16) & 0x0F] +
            HEX_CHARS[(h4 >> 12) & 0x0F] + HEX_CHARS[(h4 >> 8) & 0x0F] +
            HEX_CHARS[(h4 >> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F] +
            HEX_CHARS[(h5 >> 28) & 0x0F] + HEX_CHARS[(h5 >> 24) & 0x0F] +
            HEX_CHARS[(h5 >> 20) & 0x0F] + HEX_CHARS[(h5 >> 16) & 0x0F] +
            HEX_CHARS[(h5 >> 12) & 0x0F] + HEX_CHARS[(h5 >> 8) & 0x0F] +
            HEX_CHARS[(h5 >> 4) & 0x0F] + HEX_CHARS[h5 & 0x0F] +
            HEX_CHARS[(h6 >> 28) & 0x0F] + HEX_CHARS[(h6 >> 24) & 0x0F] +
            HEX_CHARS[(h6 >> 20) & 0x0F] + HEX_CHARS[(h6 >> 16) & 0x0F] +
            HEX_CHARS[(h6 >> 12) & 0x0F] + HEX_CHARS[(h6 >> 8) & 0x0F] +
            HEX_CHARS[(h6 >> 4) & 0x0F] + HEX_CHARS[h6 & 0x0F];
        if (!this.is224) {
            hex += HEX_CHARS[(h7 >> 28) & 0x0F] + HEX_CHARS[(h7 >> 24) & 0x0F] +
                HEX_CHARS[(h7 >> 20) & 0x0F] + HEX_CHARS[(h7 >> 16) & 0x0F] +
                HEX_CHARS[(h7 >> 12) & 0x0F] + HEX_CHARS[(h7 >> 8) & 0x0F] +
                HEX_CHARS[(h7 >> 4) & 0x0F] + HEX_CHARS[h7 & 0x0F];
        }
        return hex;
    };
    Sha256.prototype.toString = Sha256.prototype.hex;
    Sha256.prototype.digest = function () {
        this.finalize();
        var h0 = this.h0,
            h1 = this.h1,
            h2 = this.h2,
            h3 = this.h3,
            h4 = this.h4,
            h5 = this.h5,
            h6 = this.h6,
            h7 = this.h7;
        var arr = [(h0 >> 24) & 0xFF, (h0 >> 16) & 0xFF, (h0 >> 8) & 0xFF, h0 & 0xFF, (h1 >> 24) & 0xFF, (h1 >> 16) & 0xFF, (h1 >> 8) & 0xFF, h1 & 0xFF, (h2 >> 24) & 0xFF, (h2 >> 16) & 0xFF, (h2 >> 8) & 0xFF, h2 & 0xFF, (h3 >> 24) & 0xFF, (h3 >> 16) & 0xFF, (h3 >> 8) & 0xFF, h3 & 0xFF, (h4 >> 24) & 0xFF, (h4 >> 16) & 0xFF, (h4 >> 8) & 0xFF, h4 & 0xFF, (h5 >> 24) & 0xFF, (h5 >> 16) & 0xFF, (h5 >> 8) & 0xFF, h5 & 0xFF, (h6 >> 24) & 0xFF, (h6 >> 16) & 0xFF, (h6 >> 8) & 0xFF, h6 & 0xFF];
        if (!this.is224) {
            arr.push((h7 >> 24) & 0xFF, (h7 >> 16) & 0xFF, (h7 >> 8) & 0xFF, h7 & 0xFF);
        }
        return arr;
    };
    Sha256.prototype.array = Sha256.prototype.digest;
    Sha256.prototype.arrayBuffer = function () {
        this.finalize();
        var buffer = new ArrayBuffer(this.is224 ? 28 : 32);
        var dataView = new DataView(buffer);
        dataView.setUint32(0, this.h0);
        dataView.setUint32(4, this.h1);
        dataView.setUint32(8, this.h2);
        dataView.setUint32(12, this.h3);
        dataView.setUint32(16, this.h4);
        dataView.setUint32(20, this.h5);
        dataView.setUint32(24, this.h6);
        if (!this.is224) {
            dataView.setUint32(28, this.h7);
        }
        return buffer;
    };

    function HmacSha256(key, is224, sharedMemory) {
        var i, type = typeof key;
        if (type === 'string') {
            var bytes = [],
                length = key.length,
                index = 0,
                code;
            for (i = 0; i < length; ++i) {
                code = key.charCodeAt(i);
                if (code < 0x80) {
                    bytes[index++] = code;
                } else if (code < 0x800) {
                    bytes[index++] = (0xc0 | (code >> 6));
                    bytes[index++] = (0x80 | (code & 0x3f));
                } else if (code < 0xd800 || code >= 0xe000) {
                    bytes[index++] = (0xe0 | (code >> 12));
                    bytes[index++] = (0x80 | ((code >> 6) & 0x3f));
                    bytes[index++] = (0x80 | (code & 0x3f));
                } else {
                    code = 0x10000 + (((code & 0x3ff) << 10) | (key.charCodeAt(++i) & 0x3ff));
                    bytes[index++] = (0xf0 | (code >> 18));
                    bytes[index++] = (0x80 | ((code >> 12) & 0x3f));
                    bytes[index++] = (0x80 | ((code >> 6) & 0x3f));
                    bytes[index++] = (0x80 | (code & 0x3f));
                }
            }
            key = bytes;
        } else {
            if (type === 'object') {
                if (key === null) {
                    throw new Error(ERROR);
                } else if (ARRAY_BUFFER && key.constructor === ArrayBuffer) {
                    key = new Uint8Array(key);
                } else if (!Array.isArray(key)) {
                    if (!ARRAY_BUFFER || !ArrayBuffer.isView(key)) {
                        throw new Error(ERROR);
                    }
                }
            } else {
                throw new Error(ERROR);
            }
        }
        if (key.length > 64) {
            key = (new Sha256(is224, true)).update(key).array();
        }
        var oKeyPad = [],
            iKeyPad = [];
        for (i = 0; i < 64; ++i) {
            var b = key[i] || 0;
            oKeyPad[i] = 0x5c ^ b;
            iKeyPad[i] = 0x36 ^ b;
        }
        Sha256.call(this, is224, sharedMemory);
        this.update(iKeyPad);
        this.oKeyPad = oKeyPad;
        this.inner = true;
        this.sharedMemory = sharedMemory;
    }
    HmacSha256.prototype = new Sha256();
    HmacSha256.prototype.finalize = function () {
        Sha256.prototype.finalize.call(this);
        if (this.inner) {
            this.inner = false;
            var innerHash = this.array();
            Sha256.call(this, this.is224, this.sharedMemory);
            this.update(this.oKeyPad);
            this.update(innerHash);
            Sha256.prototype.finalize.call(this);
        }
    };
    var exports = createMethod();
    exports.sha256 = exports;
    exports.sha224 = createMethod(true);
    exports.sha256.hmac = createHmacMethod();
    exports.sha224.hmac = createHmacMethod(true);
    if (COMMON_JS) {
        module.exports = exports;
    } else {
        root.sha256 = exports.sha256;
        root.sha224 = exports.sha224;
        if (AMD) {
            define(function () {
                return exports;
            });
        }
    }
})();

function socketio_pusher_handler(data) {
    if (data.status === Hell.SOCKETIO_PUSHER_GENERIC_WHEEL && typeof (window.wheel) != 'undefined') {
        window.wheel.socketio_pusher(data);
        return true;
    }
    if (data.type == Hell.SOCKETIO_PUSHER_GENERIC_MESSAGE) {
        if (data.status === Hell.RESPONSE_STATUS_SUCCESS) {
            ShowMsg(localization[data.status], data.message, Hell.RESPONSE_STATUS_SUCCESS, 10000);
        }
        if (data.status === Hell.RESPONSE_STATUS_INFO) {
            ShowMsg(localization[data.status], data.message, Hell.RESPONSE_STATUS_INFO, 10000);
        }
        if (data.status === Hell.RESPONSE_STATUS_ERROR) {
            show_notification_error(data.error_message);
        }
        return true;
    }
    window.notice.add_message({
        "title": localization[data.type],
        "text": localization[data.message],
        "href": data.href,
        "type": data.type
    }, 0, null);
}
var I18N = function (key) {
    var translation = function (key) {
        return key in localizationTokens ? localizationTokens[key] : key;
    }
    if (typeof key !== 'undefined') {
        return translation(key);
    } else {
        return {
            caseInfo: function (casesInfo) {
                casesInfo.forEach(function (caseInfo, idx) {
                    casesInfo[idx].weapon_name = translation(caseInfo.weapon_name);
                    casesInfo[idx].skin_name = translation(caseInfo.skin_name);
                });
                return casesInfo;
            }
        }
    }
}
window.$t = I18N;
window.$i18n = I18N();
var localization = new Proxy({}, {
    get(target, name) {
        return $t(name);
    },
});
var payout_model = {
    show: {},
};
$('.show_menu').click(function () {
    $('.mobile-menu').fadeIn('fast');
    $('body').addClass('is-modal');
});
$('.close-menu').click(function () {
    $('.mobile-menu').fadeOut('fast');
    $('body').removeClass('is-modal');
});
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}
var pjax_fix = function (elem) {
    var html_name = '_' + elem + '_html';
    if (window[html_name] != undefined) {
        var nocache = $(elem).html();
        $(elem).html(window[html_name]);
        $(nocache).find(".nocache").each(function (index) {
            $(elem).find(".nocache").eq(index).html($(this).html());
        });
    } else {
        window[html_name] = $(elem).html();
    }
}

function currency_calc_amount(price_usd) {
    return (price_usd * config.CURRENCY_RATE).toFixed(2);
}

function set_data_before() {
    if (config.CURRENT_CURRENCY != 'USD') {
        return 'data-before="' + $("<div/>").html(config.CURRENCY_SYMBOL).text() + '"';
    }
    return '';
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function preCacheItems() {
    $.each(caseInfo, function () {
        var img = new Image();
        img.src = this.steam_image;
    });
};

function validatePromo(name) {
    var r = /[a-zA-Z0-9]+/i;
    if (name.length >= 20) return false;
    if (r.test(name) == false) return false;
    return true;
}

function validateTradeLink(link) {
    var re = /^https?:\/\/steamcommunity.com\/tradeoffer\/new\/\?partner=(\d+)&token=(.{8}$)/i;
    var m;
    if ((m = re.exec(link)) !== null) {
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }
        if (typeof m[2] != 'undefined' && typeof m[1] != 'undefined') {
            return true;
        }
    }
    return false;
};

function isVisibleElement(element) {
    return (element.offsetParent !== null);
}

function jsLazyload() {
    var lazy_images = document.querySelectorAll("img[data-src]");
    for (var i = 0; i < lazy_images.length; i++) {
        if (isVisibleElement(lazy_images[i])) {
            lazy_images[i].src = lazy_images[i].getAttribute("data-src");
            lazy_images[i].removeAttribute("data-src");
            if ((lazy_images[(i + 1)]) && (lazy_images[(i + 1)].getAttribute("data-src"))) {
                new Image().src = lazy_images[(i + 1)].getAttribute("data-src");
            }
        }
    }
    var lazy_frame = document.querySelectorAll("iframe[data-src]");
    for (var i = 0; i < lazy_frame.length; i++) {
        if (isVisibleElement(lazy_frame[i])) {
            lazy_frame[i].src = lazy_frame[i].getAttribute("data-src");
            lazy_frame[i].removeAttribute("data-src");
        }
    }
}

function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    return (rect.bottom >= 0 && rect.right >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight) && rect.left <= (window.innerWidth || document.documentElement.clientWidth));
}

function login(url, title, w, h) {
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
    if (window.focus) {
        newWindow.focus();
    }
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        return false;
    }
    return true;
}

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

function get_global_domain() {
    var global_domain = '.hellcase.' + document.location.hostname.split('.')[document.location.hostname.split('.').length - 1];
    return global_domain;
}

function base_url_path(url, project) {
    if (url.includes('http')) {
        return url;
    }
    if (project == 'all') {
        return url;
    }
    var global_domain = 'hellcase.' + document.location.hostname.split('.')[document.location.hostname.split('.').length - 1];
    if (project == 'csgo') {
        return 'https://' + (global_domain + '/' + url).replace('//', '/');
    }
    return 'https://' + project + '.' + (global_domain + '/' + url).replace('//', '/');
}

function getFromStorage(key) {
    if (hasStorage) {
        return window.localStorage.getItem(key);
    }
    return Cookies.get(key);
}

function setToStorage(key, data) {
    if (hasStorage) {
        return window.localStorage.setItem(key, data);
    }
    return Cookies.set(key, data);
}

function countdown_percent(time_start, time_finished) {
    var now_unix = moment().unix();
    var start_unix = moment(time_start).unix();
    var finish_unix = moment(time_finished).unix();
    var prc = (((now_unix - start_unix) / (finish_unix - start_unix)) * 100).toFixed(2);
    if (parseFloat(prc) > 100) return 100;
    return prc;
}

function lazyLoad() {
    var lazy = document.getElementsByClassName('lazy');
    for (var i = 0; i < lazy.length; i++) {
        if (isInViewport(lazy[i])) {
            if (lazy[i].getAttribute('data-src')) {
                lazy[i].src = lazy[i].getAttribute('data-src');
                lazy[i].removeAttribute('data-src');
            }
        }
    }
    var lazybg = document.getElementsByClassName('lazy-bg');
    for (var i = 0; i < lazybg.length; i++) {
        if (isInViewport(lazybg[i])) {
            if (lazybg[i].getAttribute('data-bg')) {
                lazybg[i].style.backgroundImage = 'url("' + lazybg[i].getAttribute('data-bg') + '")';
                lazybg[i].removeAttribute('data-bg');
            }
        }
    }
    cleanLazy();
}

function cleanLazy() {
    var lazy = document.getElementsByClassName('lazy');
    lazy = Array.prototype.filter.call(lazy, function (l) {
        return l.getAttribute('data-src');
    });
    var lazy = document.getElementsByClassName('lazy-bg');
    lazy = Array.prototype.filter.call(lazy, function (l) {
        return l.getAttribute('data-bg');
    });
}

function registerListener(event, func) {
    if (window.addEventListener) {
        window.addEventListener(event, func)
    } else {
        window.attachEvent('on' + event, func)
    }
}
var parseTradeLink = function (link) {
    var re = /^https?:\/\/steamcommunity.com\/tradeoffer\/new\/\?partner=(\d+)&token=(.{8})$/i;
    var m;
    if ((m = re.exec(link)) !== null) {
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }
        if (typeof m[2] != 'undefined') {
            return m;
        }
    }
    return false;
}

function getImage(str, w, h) {
    w = w || 384
    h = h || 384
    return str + '/' + w + 'fx' + h + 'f'
}

function get_plural_secs(num, locale) {
    var forms_en = ['second', 'seconds'];
    if (num === 1) {
        return forms_en[0];
    }
    return forms_en[1];
}

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}

function hget_time() {
    if (!Date.now) {
        Date.now = function () {
            return new Date().getTime();
        }
    }
    return Math.floor(Date.now() / 1000);
}

function htime_ago(time) {
    var n = hget_time();
    return n - time;
}

function format_time(time) {
    var min = (time / 60 | 0);
    if (min < 10) min = '0' + min;
    var sec = time - (min * 60);
    if (sec < 10) sec = '0' + sec;
    return min + ':' + sec;
}

function preload_images(images, cb) {
    var images_loaded = 0;
    var max_items = images.length;
    $.each(images, function (idx, item) {
        var img = new Image();
        img.src = item;
        img.onload = function () {
            images_loaded = images_loaded + 1;
            if (images_loaded === max_items) {
                if (typeof (cb) === 'function') {
                    cb();
                }
                return false;
            }
        };
    });
}

function to_center($el) {
    $el.css('left', 'calc(50% - ' + $el.width() + 'px / 2)');
    $el.css('top', 'calc(50% - ' + $el.height() + 'px / 2)');
}

function socket_bind() {
    socket.on('updateStats', function (data) {
        updateStats(data);
    });
    socket.on('notice', function (data) {
        $.each(data, function (index, item) {
            window.notice.add_message(item);
        });
    });
    socket.on('socketio_pusher', function (data) {
        socketio_pusher_handler(data);
    });
}

function reconnectSock() {
    socket.io.disconnect();
    socket = io(config.CDN_SOCKET2, {
        secure: true,
        transports: ['websocket']
    });
    socket_casebattle = io(config.CDN_SOCKET2, {
        secure: true,
        transports: ['websocket']
    });
    window.socket_io = socket;
    socket.on('connect', function () {
        socket.emit('auth');
        socket.emit(config.PROJECT);
        socket.emit('init');
        if (typeof (drop) == 'undefined' || (drop != Hell.DROP_TYPE_BEST && drop != Hell.DROP_TYPE_TOP24)) {
            socket.emit('switchToAll');
        } else if (drop == Hell.DROP_TYPE_TOP24) {
            socket.emit('switchToTop24');
        }
    });
    socket_bind();
}
Vue.filter('limit', function (array, length) {
    var limitCount = parseInt(length, 10);
    if (limitCount <= 0) {
        return array;
    }
    return array.slice(0, limitCount);
});
var Share = {
    socials: {
        VK: 'vk',
        TWITTER: 'tw',
        FACEBOOK: 'fb',
        QQ: 'qq',
        QQZONE: 'qqzone',
        WEIBO: 'weibo'
    },
    type: {
        ITEM: 'item',
        PROMO: 'promo'
    },
    getShareLink(social, text, partnerURL) {
        text = encodeURI(text);
        switch (social) {
            case Share.socials.VK:
                return 'https://vk.com/share.php?url=' + partnerURL + '&comment=' + text;
            case Share.socials.TWITTER:
                return 'https://twitter.com/intent/tweet?text=' + text + ' %20' + partnerURL;
            case Share.socials.FACEBOOK:
                return 'https://www.facebook.com/sharer/sharer.php?u=' + partnerURL + '&quote=' + text;
            case Share.socials.QQ:
                return 'https://connect.qq.com/widget/shareqq/index.html?url=' + partnerURL + '&title=Hellcase&summary=' + text + '&pics=';
            case Share.socials.QQZONE:
                return 'https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=' + partnerURL + '&title=Hellcase&summary=' + text;
            case Share.socials.WEIBO:
                return 'http://service.weibo.com/share/share.php?url=' + partnerURL + '&title=' + text + '&pic=';
            default:
                return 'https://twitter.com/intent/tweet?text=' + text + ' %20' + partnerURL;
        }
    },
    toSocial: function (social, type, options) {
        var text = '';
        switch (type) {
            case Share.type.ITEM:
                text = $t('share.item').replace('%s', options.weapon)
                break;
            case Share.type.PROMO:
                text = $t('share.main')
                break;
        }
        var partnerUrl = user.partner_url;
        if (social === Share.socials.QQZONE || social === Share.socials.WEIBO) {
            partnerUrl = config.base_url + 'open/';
            if (options.casename) {
                partnerUrl = partnerUrl + options.casename + '/';
            }
            partnerUrl = partnerUrl + options.open_id;
        }
        var url = this.getShareLink(social, text, partnerUrl);
        window.open(url);
    }
}
$(document).ready(function () {
    $('.social-share').on('click', function (e) {
        e.preventDefault();
        var $link = $(this);
        Share.toSocial($link.data('social'), $link.data('type'), {
            open_id: $link.data('open-id')
        });
    });
});

function toggle_livedrop() {
    if ($('#live_drop').hasClass('hide_live')) {
        livedrop = 'on';
        setToStorage('livedrop', 'on');
    } else {
        livedrop = 'off';
        setToStorage('livedrop', 'off');
    }
    $('#live_drop').toggleClass('hide_live');
    $('#main').toggleClass('full');
}

function updateStats(data) {
    if (data) {
        window.data_stats = data;
    } else {
        data = window.data_stats;
    }
    if (data) {
        if (typeof (data.project) != 'undefined' && data.project !== config.PROJECT) return false;
        $('#user-stat i').html(parseInt(data.users).toLocaleString());
        $('#overall-case-stat i').html(parseInt(data.case).toLocaleString());
        $('#overall-contract-stat i').html(parseInt(data.contract).toLocaleString());
        $('#overall-upgrade-stat i').html(parseInt(data.upgrade).toLocaleString());
        $('#online-stat i').html(parseInt(data.online).toLocaleString());
        $('#casebattle-stat i').html(parseInt(data.casebattle).toLocaleString());
        $('.h-stat').fadeIn(400).css({
            'display': '-webkit-box',
            'display': '-ms-flexbox',
            'display': 'flex'
        });
    }
}

function updateBalance(newbalance) {
    if (newbalance == NaN) return false;
    if (newbalance < 0) {
        newbalance = 0;
    } else {
        newbalance = currency_calc_amount(newbalance);
    }
    $(".js-balance").html(newbalance);
    $(".profile-info__item .js-balance").html(newbalance);
}

function reload_page() {
    $.pjax.reload('#pjax-container', {
        cache: false
    });
    hide_overlay();
    $(".modal").fadeOut('fast');
    $(".hell-winner-modal").fadeOut('fast');
}

function show_warning() {
    var warning = getFromStorage('warning');
    if (warning == null) {
        show_overlay();
        $('#confirm').fadeIn('slow');
        $('#confirm .hellcase-btn-success').click(function () {
            hide_overlay();
            $('#confirm').fadeOut('slow');
            setToStorage('warning', true);
        });
        return false;
    }
    return true;
}

function show_trustpilot() {
    $.getScript("//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js", function (data, textStatus, jqxhr) {
        show_overlay();
        $('.trustpilot-popup').show();
        $('.trustpilot-popup .close,#overlay').one('click', function () {
            $('.trustpilot-popup').hide();
            hide_overlay();
            Cookies.set('trustpilot', '1');
        });
    });
}

function show_overlay() {
    if (!$('body').hasClass('is-modal')) {
        $('body').addClass('is-modal');
        $("#overlay").fadeIn('fast');
    }
}

function hide_overlay() {
    $('body').removeClass('is-modal');
    $("#overlay, .modal, .modal-login-form, .hell-winner-modal, .modal_common").fadeOut('fast');
    $('#overlay').css('background-image', 'none');
}

function show_modal(html) {
    show_overlay();
    $('body').one('click', '#overlay', function () {
        $('.default-modal').remove();
        hide_overlay();
    });
    $('body').one('click', '.default-modal .close', function () {
        $('.default-modal').remove();
        hide_overlay();
    });
    $('body').append('<div class="default-modal"><button class="close"><i class="hellicon-times"></i></button><div class="content">' + html + '</div></div>');
}

function short_long_string(str, split) {
    if (typeof (split) != 'string') split = '...';
    return str.replace(/^(.{7})(.*)(.{7})$/, '$1' + split + '$3');
}

function bind_odometer() {
    $('.odometer').each(function (index) {
        new Odometer({
            el: $(this)[0],
            format: "( ddd).dd",
            value: $(this).text(),
            theme: 'default'
        }).render();
    });
}

function hotkeys() {
    Mousetrap.bind('esc', function () {
        $('#overlay').click();
        location.reload();
    }, 'keyup');
    if ($('.case_open').length > 0) {
        Mousetrap.bind('enter', function (e) {
            if ($('.roulette-case-icon.run').length == 0) {
                $('#btnOpen,.open_farm,#btn_open_daily_free').click();
            }
            return false;
        });
        Mousetrap.bind('space', function (e) {
            if ($('.roulette-case-icon.run').length > 0) {
                for (var index = 0; index < window._roulettes.length; index++) {
                    if (typeof (window._roulettes[index].finish) != 'undefined') {
                        window._roulettes[index].finish();
                    }
                }
            } else {}
            return false;
        });
    }
}

function show_giveaway(url, bg) {
    show_overlay();
    if (typeof (bg) != 'undefined' && bg != '') {
        $('#overlay').css('background-image', 'url(' + bg + ')');
    }
    if ($('#giveway-iframe iframe').length > 0) {
        $('#giveway').show();
        return;
    }
    $.getScript("https://js.gleam.io/e.js").done(function (script, textStatus) {
        $('#giveway').show();
    }).fail(function (jqxhr, settings, exception) {
        console.log("Triggered ajaxError handler." + exception);
    });
}

function ShowNeedAuthModal() {
    if ($("#overlay").css('display') == 'none') {
        show_overlay();
        if ($('#signin').length > 0) {
            $("#signin").fadeIn('fast');
        } else {
            $("#auth").fadeIn('fast');
        }
    }
}

function ShowReturnUserModal() {
    if ($("#overlay").css('display') == 'none') {
        show_overlay();
        $("#return-user").show().hide().fadeIn('fast');
    }
}

function ShowLoginModal() {
    if ($("#overlay").css('display') == 'none') {
        show_overlay();
        $("#login").show().hide().fadeIn('fast');
    }
}

function ShowLoginNewModal() {
    if ($("#overlay").css('display') == 'none') {
        show_overlay();
        $("#signin").show().hide().fadeIn('fast');
    }
}

function HideLoginNewModal() {
    hide_overlay();
    $("#signin").fadeOut('fast');
}

function set_profile_state(type) {
    $.post('/' + config.lang + '/profile/toggle_private', {
        type: type
    }, function (result) {
        if (result.status == Hell.RESPONSE_STATUS_SUCCESS) {
            $('.hide_profile_toggle .checkbox').toggleClass('checked');
            ShowMsg(localization.success, localization[result.message], 'success', 3000);
        }
    });
}

function ShowSubscribeModal() {
    if ($("#overlay").css('display') == 'none') {
        show_overlay();
    }
    $("#pay").show().hide().fadeIn('fast');
    $("#pay").addClass('with_premium').addClass('only_premium');
}

function ShowAddBalanceModal(need_sum, promocode) {
    if (promocode === undefined) {
        promocode = '';
    }
    need_sum = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    need_sum = Math.ceil(need_sum);
    if (config.lang == 'cn' && parseInt(config.PAY_CN_NEW_MODAL_ACTIVE) === 1) {
        payment_cn_modal(need_sum, promocode);
        return;
    }
    if (parseInt(config.PAY_NEW_MODAL_ACTIVE) === 1) {
        payment_modal(need_sum, promocode);
        return;
    }
    if (need_sum > 0) {
        need_sum_original = need_sum;
        if (need_sum < config.pay.avg_sum) {
            need_sum = config.pay.avg_sum;
        }
        $("#pay .normalpay .needpay").show().html(localization.pay_few + ' ' + need_sum_original + ' ' + localization.curr);
        $("#pay .normalpay input:text").val(need_sum);
    } else {
        $("#pay .normalpay .needpay").hide();
    }
    $("#pay").removeClass('only_premium');
    $('#cancel_subscribe').off().click(function () {
        $.post('/' + config.lang + '/profile/cancel_self_subs', function (result) {
            console.log(result);
        });
    });
    $("#pay .cont.promocode input").val('');
    if ($("#overlay").css('display') == 'none') {
        show_overlay();
        $("#pay").show().hide().fadeIn('fast');
        try {
            ga('newTracker.send', 'event', 'Funnel', 'Balance dialog');
        } catch (e) {
            console.log('[GA] Error  ' + e.name + ":" + e.message);
        }
        if (typeof user !== undefined) {
            $.post("/" + config.lang + "/profile/check_pay_promo", {
                wallet_promocode: user.wallet_promocode
            }, function (data) {
                if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                    if (data.name == 'subscription') {
                        $(".forpromo").html(localization.subscription_add_money);
                    } else {
                        $(".forpromo").html(localization.promocode_add_money + ' <strong>' + data.name + '</strong> ' + localization.promocode_add_money_);
                    }
                    config.wallet_promocode_percent = data.percent;
                    if (data.min_refill_amount == undefined) {
                        config.min_refill_amount = 0;
                    } else {
                        config.min_refill_amount = data.min_refill_amount;
                    }
                    $('#addpromocodemoney').hide();
                    changePercentagePromoSum(config.pay.avg_sum);
                } else {
                    config.wallet_promocode_percent = 0;
                    $('.forpromo').hide();
                    $('#addpromocodemoney').hide();
                    return;
                }
            }, 'json');
        }
    }
}

function changePercentagePromoSum(value) {
    if (config.wallet_promocode_percent > 0) {
        if (typeof value !== undefined) {
            var inp = $("#pay .normalpay input:text").val();
            value = inp > 0 ? inp : config.pay.avg_sum;
        }
        var dInput = Number(value);
        if (config.min_refill_amount <= dInput) {
            var add_promo_money = ((dInput / 100) * config.wallet_promocode_percent).toFixed(2);
            $('#addpromocodemoney').html(config.CURRENCY_SYMBOL + dInput + ' + ' + config.CURRENCY_SYMBOL + add_promo_money + ' = <span style="color: #2abd69"> ' + config.CURRENCY_SYMBOL + Number(Number(add_promo_money) + Number(dInput)).toFixed(2) + '!</span>').show();
            $('.forpromo').show();
        } else {
            $('#addpromocodemoney').hide();
            $('.forpromo').hide();
        }
    } else {
        $('#addpromocodemoney').hide();
        $('.forpromo').hide();
    }
}

function get_case_image(item, project) {
    if (typeof (item) != 'object') {
        return false;
    }
    if (typeof (project) === "undefined") project = config.PROJECT;
    if (typeof (item['icon']) == 'undefined') item['icon'] = item['case_icon'];
    if (typeof (item['category']) == 'undefined') item['category'] = item['case_category'];
    if (["contract", "shards", "upgrade", "free"].indexOf(item['category']) != -1) {
        return item['icon'].search('http') === 0 ? item['icon'] : config.CDN_MAIN_PATH + '/img/' + item['category'] + "/" + item['icon'];
    }
    if (item['category'] == 'valve') {
        return item['icon'].search('http') === 0 ? item['icon'] : config.CDN_MAIN_PATH + '/img/' + project + '/case/' + item['icon'];
    }
    var case_image = item['icon'].search('http') === 0 ? item['icon'] : (is_twin_case(item['category']) ? config.CDN_MAIN_PATH + '/img/' + project + '/weapons/case/' + item['icon'] : config.CDN_MAIN_PATH + "/img/" + project + '/' + item['category'] + "/" + item['icon']);
    return case_image;
}

function get_exterior(ex) {
    if (typeof (ex) != 'string') return '';
    var arr = ex.match(/([A-Z])/g);
    if (arr == null || arr.length == 0) return '';
    return arr.join('');
}

function is_twin_case(category) {
    return (config.TWIN_CATEGORY_LIST.indexOf(category) != -1);
}

function get_case_image_weapon(item, project) {
    if (typeof (item) != 'object') {
        return false;
    }
    if (typeof (project) == 'undefined') project = config.PROJECT;
    if (typeof (item['icon']) == 'undefined') item['icon'] = item['case_icon'];
    if (typeof (item['category']) == 'undefined') item['category'] = item['case_category'];
    var case_image = item['icon'].search('http') === 0 ? item['icon'] : (is_twin_case(item['category']) ? config.CDN_MAIN_PATH + '/img/' + project + '/weapons/' + item['icon'] : config.CDN_MAIN_PATH + "/img/" + project + '/' + item['category'] + "/" + item['icon']);
    return case_image;
}

function sell_all_items(cb, is_cashout) {
    if (is_cashout === undefined) {
        is_cashout = false;
    }
    var ids = jQuery.map($('#my-items .status:empty'), function (n, i) {
        return $(n).parent().parent().data('id');
    }).join(",");
    var sum = jQuery.map($('#my-items .status:empty'), function (n, i) {
        return Number($(n).parent().parent().data('price'));
    }).reduce(function (a, b) {
        return a + b;
    }, 0);
    if (sum == 0) return false;
    $('.sell_all_items').addClass('disabled').off();
    $('.payout_all').addClass('disabled').off();
    $('.send_items_contract').addClass('disabled').off();
    $.ajax({
        url: '/' + config.lang + '/profile/sell_mass',
        type: 'POST',
        dataType: 'json',
        data: {
            ids: ids,
            is_cashout: is_cashout,
            sum: sum.toFixed(2)
        },
        success: function (data) {
            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                updateBalance(data.balance);
                $('#my-items .item').addClass('sold');
                $('#my-items .item').find('.send').remove();
                $('#my-items .item').find('.sell').remove();
                $('#my-items .item').find('.take_game').remove();
                $('#my-items .item').find('.contract-btn').remove();
                $('#my-items .item').find('.upgrade-btn').remove();
                $('#my-items .item').find('.status').html(localization.item_state_15).show();
                $('#my-items .item').find('.price').show();
                ShowMsg(localization.success, localization.is_sold, 'success', 3000);
                if (cb !== undefined) {
                    cb(data.balance);
                }
            } else {
                ShowMsg(localization.error, localization.sell_error, 'error', 3000);
            }
        },
        error: function () {
            ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
        }
    })
}

function sell_all_items_gw() {
    var ids = jQuery.map($('#my-ga .sell:not(.sold)'), function (n, i) {
        return $(n).parent().parent().data('id');
    }).join(",");
    var sum = jQuery.map($('#my-ga .sell:not(.sold)'), function (n, i) {
        return Number($(n).parent().parent().data('price'));
    }).reduce(function (a, b) {
        return a + b;
    }, 0);
    if (sum == 0) return false;
    $('.sell_all_items_gw').addClass('disabled').off();
    $.ajax({
        url: '/' + config.lang + '/profile/sell_mass',
        type: 'POST',
        dataType: 'json',
        data: {
            ids: ids,
            sum: sum.toFixed(2)
        },
        success: function (data) {
            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                updateBalance(data.balance);
                $('#my-ga .item').addClass('sold');
                $('#my-ga .item').find('.send').remove();
                $('#my-ga .item').find('.sell').remove();
                $('#my-ga .item').find('.take_game').remove();
                $('#my-ga .item').find('.contract-btn').remove();
                $('#my-ga .item').find('.upgrade-btn').remove();
                $('#my-ga .item').find('.status').html(localization.item_state_15).show();
                $('#my-ga .item').find('.price').show();
                ShowMsg(localization.success, localization.is_sold, 'success', 3000);
            } else {
                ShowMsg(localization.error, localization.sell_error, 'error', 3000);
            }
        },
        error: function () {
            ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
        }
    })
}

function send_items_contract() {
    $('.send_items_contract').addClass('.disabled').off();
    var ids = jQuery.map($('.sell:not(.sold)'), function (n, i) {
        return $(n).parent().parent().data('id');
    });
    if (ids.length == 0) return false;
    ids = ids.slice(0, 10).join(',');
    location.href = '/' + config.lang + '/contract#' + ids;
}

function win_modal_bind(share_state) {
    if (share_state === undefined) {
        share_state = false;
    }
    show_overlay();
    $('#new_win_modal').fadeIn('slow');
    $("#overlay,.reload_page").off();
    $("#overlay,.reload_page, .hell-winner-left .close").click(function () {
        if (share_state) {
            window.location.href = '/' + config.lang + '/open/' + casename;
        }
        reload_page();
        return false;
    });
    $('#btnBattle,.btn_battle').click(function () {
        for (var i = 0; i < cases_count; i++) {
            $.ajax({
                url: '/' + config.lang + '/casebattle/creategame/' + case_id,
                type: 'POST',
                dataType: 'json',
                success: function (data) {
                    if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                        updateBalance(data.balance);
                        ShowMsg(localization.success, localization.casebattle_created.format(casetitle), 'success', 2000);
                        reload_page();
                    } else {
                        if (data.error_message == 'need_auth') {
                            ShowNeedAuthModal();
                        } else if (data.error_message == 'need_sum') {
                            ShowAddBalanceModal(data.sum);
                        } else if (data.error_message == 'casebattle_no_access') {
                            $('#new_win_modal').fadeOut('slow');
                            ShowSubscribeModal();
                        } else {
                            show_notification_error(data.error_message);
                        }
                    }
                },
                error: function () {
                    show_notification_error('unknown_error');
                }
            });
        }
    });
    $(".tryagain").click(function () {
        $(this).off();
        if (typeof (event) != 'undefined' && $('#js-take-by-token').length > 0) {
            var id = $('#js-take-by-token').data('id');
            var event_id = $('#js-take-by-token').data('event');
            $.get('/' + config.lang + '/event/buy', {
                event_id: event_id,
                id: id
            }, function (response) {
                if (response.status == 'success') {
                    $.pjax.reload('#pjax-container', {
                        cache: false
                    });
                }
            });
            return true;
        }
        if (openingCase) return false;
        openingCase = true;
        $.post("/" + config.lang + "/open/" + casename + "/buy/" + cases_count, function (data) {
            hide_overlay();
            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                if (data.balance >= 0) {
                    updateBalance(data.balance);
                    openingCase = false;
                    weapons = data.weapons;
                    shards = data.shards;
                    event_tokens = data.event_tokens;
                    $.pjax.reload('#pjax-container', {
                        cache: false
                    });
                }
                try {
                    ga('newTracker.send', 'event', 'Funnel', 'Open case');
                } catch (e) {
                    console.log('[GA] Error  ' + e.name + ":" + e.message);
                }
            } else {
                openingCase = false;
                if (data.error_message == 'need_auth') {
                    ShowNeedAuthModal();
                } else if (data.error_message == 'need_sum') {
                    ShowAddBalanceModal(data.sum);
                } else {
                    show_notification_error(data.error_message);
                }
            }
        }, 'json');
    });
    $('.hell-winner-modal').click(function (e) {
        if (e.target.className.indexOf('hell-winner-modal') != -1) {
            reload_page();
        }
    });
    $(".hide-modal").one('click', function () {
        $('.hell-winner-modal').hide().html('');
    });
    $('.hell-winner-shard .combine').click(function () {
        var item = $(this).closest('.item');
        var id = item.data('id');
        $.ajax({
            url: '/' + config.lang + '/profile/combine',
            type: 'POST',
            dataType: 'json',
            data: {
                id: id
            },
            success: function (data) {
                if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                    item.hide();
                    var v = $('.hell-winner-shard .item:visible').length;
                    if (v == 0) {
                        $('.hell-winner-right').hide();
                        $('.hell-winner-center').hide();
                        $('.hell-winner-modal').removeClass('with_shard');
                    }
                    ShowMsg(localization.success, localization.shard_combined, 'success', 10000);
                } else {
                    show_notification_error(data.error_message);
                }
            },
            error: function () {}
        })
    });
}

function universal_item_modal(weapon, params, options) {
    if (options === undefined) {
        options = {};
    }
    params = $.extend({
        casename: '',
        shards: [],
        case_price: 0,
        case_id: 0,
        cases_count: 1,
        category: '',
        event_tokens: {},
        try_again_cb: null
    }, params);
    options = $.extend({
        shards_show: false,
        event_show: false,
        btn_try: false,
        btn_my: false,
        btn_sell: false,
    }, options);
    pjax_fix('#win_item_modal_once');
    window.win_item_modal_once = new Vue({
        el: '#win_item_modal_once',
        data: {
            weapons: weapon,
            shards: params.shards,
            config: config,
            user: user,
            on_close: params.on_close,
            try_again_cb: params.try_again_cb,
            casename: params.casename,
            case_id: params.case_id,
            case_price: params.case_price,
            cases_count: params.cases_count,
            category: params.category,
            lang: localization,
            event_tokens: params.event_tokens,
            options: options,
            modal_type: 'one',
            is_sale: false,
            combine_btn_show: true
        },
        created: function () {
            $('body').addClass('is-modal');
            if (this.options) {
                if (this.options.shards_show) {
                    this.shards_show = this.options.shards_show;
                }
                if (this.options.event_show) {
                    this.event_show = this.options.event_show;
                }
                if (this.options.hotkeys) {
                    this.hotkeys = this.options.hotkeys;
                    if (this.hotkeys) {
                        this.set_hotkeys();
                    }
                }
                if (this.options.share) {
                    this.share = this.options.share;
                }
                if (this.options.btn_try) {
                    this.btn_try = this.options.btn_try;
                }
                if (this.options.btn_my) {
                    this.btn_my = this.options.btn_my;
                }
                if (this.options.btn_sell) {
                    this.btn_sell = this.options.btn_sell;
                }
                if (this.options.btn_up) {
                    this.btn_up = this.options.btn_up;
                }
                if (this.options.btn_cb) {
                    this.btn_cb = this.options.btn_cb;
                }
            }
            if (config.EVENT_ACTIVE == 1 && typeof (this.event_tokens.count) != 'undefined' && this.event_tokens.count > 0) {
                if (this.event_tokens.count > 1) {
                    this.event_tokens.plural_token = localization.tokens_received.format(this.event_tokens.count);
                } else {
                    this.event_tokens.plural_token = localization.token_received;
                }
                countdown_event(this.event_tokens.time_finished, event_tokens.time_start, $('.event-tokens__timer-container'));
            }
            $('#win_item_modal_once').addClass('show').show();
            if (this.event_tokens != {}) {
                countdown_event(this.event_tokens.time_finished, this.event_tokens.time_start, $('.event-tokens__timer-container'));
            }
            if (this.weapons.length == 1) {
                this.modal_type = 'one';
            } else {
                this.modal_type = 'many';
            }
        },
        computed: {
            weapon: function () {
                if (this.weapons.length == 1) {
                    return this.weapons[0];
                } else {
                    return this.weapons.filter(function (i) {
                        return i.steam_trade_offer_state == 0;
                    });
                }
            },
            item_name: function () {
                var item_name = this.weapon.weapon_name;
                if ((config.PROJECT == 'csgo' || config.PROJECT == 'vgo') && this.weapon.steam_exterior != '' && this.weapon.steam_exterior != undefined) {
                    item_name = this.weapon.weapon_name + ' | ' + this.weapon.skin_name + ' <span>(' + this.weapon.steam_exterior + ')</span>';
                }
                if (weapon.weapon_name == 'Key') {
                    item_name = this.weapon.skin_name;
                }
                return item_name;
            },
            game_bg: function () {
                if (this.weapon.rarity == 'money') {
                    return "background-image: url('" + this.weapon.steam_image + "')";
                }
                var game_bg = getImage(this.weapon.steam_image, 360, 360) + '.png';
                if (this.config.PROJECT == 'pubg') {}
                if (this.config.PROJECT == 'dota2') {}
                if (this.config.PROJECT == 'games') {
                    game_bg = this.weapon.steam_image;
                }
                return "background-image: url('" + game_bg + "')";
            },
            price: function () {
                var price = 0;
                if (this.modal_type == 'one') {
                    if (this.weapon.win_price != undefined) {
                        price = (Number)(this.weapon.win_price).toFixed(2);
                    } else {
                        price = (Number)(this.weapon.steam_price_en).toFixed(2);
                    }
                } else {
                    price = this.weapon.reduce(function (total, n) {
                        return (parseFloat(total) + ((n.steam_trade_offer_state == 0) ? parseFloat(n.steam_price_en) : 0))
                    }, 0).toFixed(2);
                }
                return price;
            },
            cb_price: function () {
                return (this.cases_count * this.case_price).toFixed(2);
            },
            shard_info: function () {
                return (typeof this.shards[0] !== 'undefined' ? (localization['shard_info_' + this.shards[0].shard_count]) : localization.shard_info_1);
            }
        },
        methods: {
            set_hotkeys: function () {
                var self = this;
                Mousetrap.bind('esc', function () {
                    self.close();
                }, 'keyup');
                Mousetrap.bind('s', function (e) {
                    if (self.modal_type == 'one') {
                        self.sell(self.weapon);
                    } else {
                        self.sell_all();
                    }
                });
                Mousetrap.bind('r', function (e) {
                    self.tryagain();
                    return false;
                });
            },
            show: function () {
                var self = this;
                $('body').addClass('is-modal');
                show_overlay();
                $('#win_item_modal_once').addClass('show');
                $('#overlay').one('click', function () {
                    self.close();
                });
            },
            get_game_bg: function (data) {
                var game_bg = getImage(data.steam_image, 360, 360) + '.png';
                if (this.config.PROJECT == 'pubg') {}
                if (this.config.PROJECT == 'dota2') {}
                if (this.config.PROJECT == 'games') {
                    game_bg = data.steam_image;
                }
                return "background-image: url('" + game_bg + "')";
            },
            sell: function (item) {
                var self = this;
                if (!self.is_sale) {
                    self.is_sale = true;
                    $.ajax({
                        url: '/' + config.lang + '/profile/sell',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            id: item.id
                        },
                        success: function (data) {
                            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                                updateBalance(data.balance);
                                ShowMsg(localization.success, localization.is_sold, 'success', 3000);
                                item.steam_trade_offer_state = 15;
                                if (self.modal_type == 'one') {
                                    self.close();
                                }
                                if (self.weapon.length == 0) {
                                    self.close();
                                }
                                self.is_sale = false;
                            } else {
                                ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                            }
                        },
                        error: function () {
                            ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                        }
                    })
                }
            },
            sell_all: function () {
                var self = this;
                if (!self.is_sale) {
                    self.is_sale = true;
                    var ids = this.weapon.map(function (elem) {
                        if (elem.steam_trade_offer_state != Hell.STEAM_TRADE_OFFER_STATE_SOLD) {
                            return elem.id;
                        }
                    }).join(",");
                    var sum = 0;
                    var arr = this.weapon.map(function (elem) {
                        if (elem.steam_trade_offer_state != Hell.STEAM_TRADE_OFFER_STATE_SOLD) {
                            return Number(elem.steam_price_en);
                        }
                    });
                    for (var i in arr) {
                        if (arr[i] !== undefined) {
                            sum += arr[i];
                        }
                    }
                    $.ajax({
                        url: '/' + config.lang + '/profile/sell_mass',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            ids: ids,
                            sum: sum.toFixed(2)
                        },
                        success: function (data) {
                            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                                updateBalance(data.balance);
                                ShowMsg(localization.success, localization.is_sold, 'success', 3000);
                                self.close();
                                self.is_sale = false;
                            } else {
                                ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                            }
                        },
                        error: function () {
                            ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                        }
                    })
                }
            },
            tryagain: function () {
                if (typeof (this.try_again_cb) == 'function') {
                    this.try_again_cb();
                    return false;
                }
                reload_page();
            },
            shareItem: function (social) {
                Share.toSocial(social, Share.type.ITEM, {
                    weapon: this.weapon.steam_market_hash_name,
                    casename: this.casename,
                    open_id: this.weapon.id
                });
            },
            close: function () {
                $('#win_item_modal_once').removeClass('show');
                $('body').removeClass('is-modal');
                if (typeof (this.on_close) == 'function') {
                    this.on_close();
                }
                reload_page();
            },
            combine: function (data) {
                var id = data.id;
                if (this.combine_btn_show) {
                    $.ajax({
                        url: '/' + config.lang + '/profile/combine',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            id: id
                        },
                        success: function (data) {
                            this.combine_btn_show = false;
                            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                                var v = $('.hell-winner-shard .item:visible').length;
                                if (v == 0) {
                                    $('.hell-winner-right').hide();
                                    $('.hell-winner-center').hide();
                                    $('.hell-winner-modal').removeClass('with_shard');
                                }
                                ShowMsg(localization.success, localization.shard_combined, 'success', 10000);
                            } else {
                                show_notification_error(data.error_message);
                            }
                        },
                        error: function () {}
                    })
                }
            },
            hide: function () {
                $('#win_item_modal_once').removeClass('show');
                $('body').removeClass('is-modal');
                hide_overlay();
            }
        },
    });
}

function farm_modal(weapon, farm_case) {
    pjax_fix('#farm-popup');
    window.farm = new Vue({
        el: '#farm-popup',
        data: {
            weapon: weapon,
            status: 'win',
            farm_case: farm_case,
            profile_url: '/' + config.lang + '/profile/' + user.id,
        },
        created: function () {
            this.show();
        },
        methods: {
            show: function () {
                $('#farm-popup').show();
                show_overlay();
                if (this.weapon.length == 0) this.status = "lost";
                else this.status = "win";
                $('#overlay').one('click', function () {
                    window.farm.close();
                });
                $('.sold-for').off();
                Vue.nextTick(function () {
                    $('.sold-for').click(function () {
                        $('.items-block').toggleClass('hide');
                    });
                });
            },
            sell: function () {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/profile/sell',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id: self.weapon[0].id
                    },
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            updateBalance(data.balance);
                            ShowMsg(localization.success, localization.is_sold, 'success', 3000);
                        } else {
                            ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                        }
                        self.close();
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                })
            },
            tryagain: function () {
                this.close();
            },
            close: function () {
                this.weapon = [];
                $('#farm-popup').hide();
                hide_overlay();
            }
        },
    });
}

function show_game_code_modal(open_id, cb) {
    if (window.game_code_modal_html != undefined) {
        $('.modal_game_code').html(window.game_code_modal_html);
    } else {
        window.game_code_modal_html = $('.modal_game_code').html();
    }
    pjax_fix('#modal_game_code');
    window.game_code_modal = new Vue({
        el: '.modal_game_code',
        data: {
            game: {},
            code: '',
            copied: false,
        },
        created: function () {
            var self = this;
            $.post('/' + config.lang + '/profile/get_code', {
                open_id: open_id
            }, function (data) {
                if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                    self.game = data.info;
                    self.code = data.info.code;
                    show_overlay();
                    $('.modal_game_code').show();
                    if (typeof (cb) == 'function') {
                        cb(data);
                    }
                    Vue.nextTick(function () {
                        $('#overlay,.close').click(function () {
                            $('.modal_game_code').hide();
                            hide_overlay();
                        });
                    });
                } else {
                    if (data.type == 'steam' && typeof (data.error_message) == 'string') {
                        if (data.error_message.search('(15)') > 0) {
                            ShowMsg(localization.error, localization.trade_error_15, 'error', 10000);
                        } else {
                            ShowMsg(localization.error, data.error_message, 'error', 10000);
                        }
                    } else {
                        if (typeof (data.should_refill) != 'undefined' && data.should_refill == true) {
                            ShowMsg(localization.error, localization[data.error_message].format(data.need_sum), 'error', 10000);
                        } else {
                            show_notification_error(data.error_message);
                        }
                    }
                }
            });
        },
        methods: {
            copy_code: function (selector) {
                copyToClipboard(selector);
                $('.copied').fadeToggle('fast');
                setTimeout(function () {
                    $('.copied').fadeToggle('fast');
                }, 1000)
            },
        }
    });
}

function copyToClipboard(elementId) {
    var aux = document.createElement("input");
    aux.setAttribute("value", document.getElementById(elementId).innerHTML);
    document.body.appendChild(aux);
    aux.select();
    document.execCommand("copy");
    document.body.removeChild(aux);
}

function countdown_case(datetime) {
    var local = moment(datetime).format('YYYY-MM-DD HH:mm:ss');
    $(".hell-timer-digits").countdown(local, function (event) {
        var format = "<div><h3>%M</h3><span>minutes</span></div><div><h3>%S</h3><span>seconds</span></div>";
        if (event.offset.totalHours > 0) {
            format = "<div><h3>%H</h3><span>hours</span></div><div><h3>%M</h3><span>minutes</span></div><div><h3>%S</h3><span>seconds</span></div>";
        }
        if (event.offset.totalDays > 0) {
            format = "<div><h3>%-D</h3><span>days</span></div><div><h3>%H</h3><span>hours</span></div><div><h3>%M</h3><span>minutes</span></div><div><h3>%S</h3><span>seconds</span></div>";
        }
        if (event.type == "finish") {
            setTimeout(function () {
                location.reload();
            }, 10000);
        }
        $(this).html(event.strftime(format));
    });
}

function countdown_event(datetime, time_start, selector) {
    var local = moment(datetime).format('YYYY-MM-DD HH:mm:ss');
    var cell = '<div class="event-tokens__timer-value"><div class="timer-text_xl">{0}</div><div class="timer-text_xs">{1}</div></div>';
    selector.countdown(local, function (event) {
        format = '';
        if (event.offset.totalDays > 0) {
            format += cell.format('%D', 'DAYS');
        }
        format += cell.format('%H', 'HOURS');
        format += cell.format('%M', 'MINUTES');
        if (event.offset.totalDays == 0) {
            format += cell.format('%S', 'SECONDS');
        }
        if (time_start != null) {
            var prc = countdown_percent(time_start, datetime);
            var percent_html = '<div class="event-tokens__timer-loader" style="width: {0}%"></div>'.format(prc);
        } else {
            var percent_html = '';
        }
        $(this).html(percent_html + event.strftime(format));
    });
}

function countdown_event_case(datetime, time_start, selector) {
    var local = moment(datetime).format('YYYY-MM-DD HH:mm:ss');
    var cell = '<div class="timer-item"><div class="number">{0}</div><div class="text">{1}</div></div>';
    selector.countdown(local, function (event) {
        format = '';
        if (event.offset.totalDays > 0) {
            format += cell.format('%D', 'DAYS');
        }
        format += cell.format('%H', 'HOURS');
        format += cell.format('%M', 'MINUTES');
        if (event.offset.totalDays == 0) {
            format += cell.format('%S', 'SECONDS');
        }
        if (time_start != null) {
            var prc = countdown_percent(time_start, datetime);
            $('.roulette-container__event .timer-loader').css({
                'width': prc + '%'
            });
        }
        $(this).html(event.strftime(format));
    });
}

function countdown_main_page_event(datetime, selector) {
    var local = moment(datetime).format('YYYY-MM-DD HH:mm:ss');
    selector.countdown(local, function (event) {
        format = '\
        <div class="heading__timer-item"><div class="heading__timer-item--value">%D</div><div class="heading__timer-item--subtext">DAYS</div></div>\
        <div class="heading__timer-item"><div class="heading__timer-item--value">%H</div><div class="heading__timer-item--subtext">HOURS</div></div>\
        <div class="heading__timer-item"><div class="heading__timer-item--value">%M</div><div class="heading__timer-item--subtext">MINUTES</div></div>\
        <div class="heading__timer-item"><div class="heading__timer-item--value">%S</div><div class="heading__timer-item--subtext">SECONDS</div></div>';
        $(this).html(event.strftime(format));
    });
}

function ShowFreeCaseModal() {
    if (user.id != null) {
        return;
    }
    var total_time = 160;
    var current_time = total_time;
    var percent = 100;
    var interval = null;
    String.prototype.toMMSS = function () {
        var sec_num = parseInt(this, 10);
        var hours = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        return minutes + ':' + seconds;
    }
    show_overlay();
    $('.free_case').fadeIn('fast');
    $('#overlay').one('click', function () {
        $(this).fadeOut('fast');
        $('.free_case').hide();
    });
    interval = setInterval(function () {
        if (current_time <= 0) {
            clearInterval(interval);
            $('#overlay').fadeOut('fast');
            $('.free_case').fadeOut('fast');
            return;
        }
        current_time = current_time - 1;
        percent = current_time / (total_time / 100);
        current_time = current_time + "";
        $('.free_case-footer-progress').attr('style', 'width: ' + percent + '%;');
        $('.free_case-footer-timer').text(current_time.toMMSS());
    }, 1000);
}

function case_open() {
    window.case_open_wrap = new Vue({
        el: '.case-open__wrap',
        data: {
            case_counter: [1, 2, 3, 4, 5, 10],
            case_counter_cur: 1,
            sound: true
        },
        computed: {
            caseObj: function () {
                var item = {};
                if (casename) {
                    item.casename = casename;
                    item.casetitle = casetitle;
                    item.category = category;
                    item.case_id = case_id;
                    item.caseIconURL = caseIconURL;
                    item.caseWeaponURL = caseWeaponURL;
                    item.casePrice = casePrice;
                    item.event = casePrice;
                }
                return item;
            }
        },
        created: function () {
            console.log('created');
            var self = this;
            var status_sound = getFromStorage('sound');
            var storage_count = getFromStorage('count');
            if (status_sound == 'off')
                this.sound = false;
            else
                this.sound = true;
            if ($('.hell-timer').length == 1) {
                var datetime = $('.hell-timer').data('time');
                countdown_case(datetime);
            }
            if ($('.info__bottom-content--timer').length == 1) {
                countdown_event_case(event.time_finished, event.time_start, $('.info__bottom-content--timer'));
            }
            $.ajax({
                url: '/' + config.lang + '/open/' + casename + '/state',
                type: 'POST',
                dataType: 'json',
                success: function (data) {
                    if (data.bought) {
                        self.case_counter_cur = data.weapons.length;
                        weapons = data.weapons;
                        shards = data.shards;
                        open_case_id = data.case_number;
                        event_tokens = data.event_tokens;
                        self.$nextTick(function () {
                            self.hide_elements();
                        });
                        window._roulettes = [];
                        window._roulettes_finished = 0;
                        window._roulettes_total = data.weapons.length;
                        self.$nextTick(function () {
                            for (var i in data.weapons) {
                                run(data.weapons[i]);
                            }
                        });
                    }
                },
                error: function () {
                    ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                }
            })
        },
        mounted: function () {},
        methods: {
            check_state: function (casename) {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/open/' + casename + '/state',
                    type: 'POST',
                    dataType: 'json',
                    success: function (data) {
                        if (data.bought) {
                            self.case_counter_cur = data.weapons.length;
                            weapons = data.weapons;
                            shards = data.shards;
                            open_case_id = data.case_number;
                            event_tokens = data.event_tokens;
                            self.$nextTick(function () {
                                self.hide_elements();
                            });
                            window._roulettes = [];
                            window._roulettes_finished = 0;
                            window._roulettes_total = data.weapons.length;
                            self.$nextTick(function () {
                                for (var i in data.weapons) {
                                    run(data.weapons[i]);
                                }
                            });
                        }
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                })
            },
            set_case_counter_cur: function (data) {
                this.case_counter_cur = data;
                ShowCaseLines(data);
            },
            calcPrice: function (data) {
                return (data * this.case_counter_cur).toFixed(2);
            },
            case_bg: function (data) {
                return "background-image: url('" + data + "')";
            },
            hide_elements: function () {
                $("#btnOpen").hide();
                $("#js-take-by-token").hide();
                $(".event-coin").hide();
                $(".roulette-container__event").hide();
                $("#btnDropdownChoose").hide();
                $(".action-button #cb").hide();
                $(".action-button #cb_btn").hide();
                $("#btnOpening").show();
            },
            sound_change: function () {
                if (this.sound) {
                    this.sound = false;
                    setToStorage('sound', 'off');
                } else {
                    this.sound = true;
                    setToStorage('sound', 'on');
                }
            },
            buy_case: function (casename, cases_count) {
                var self = this;
                self.$nextTick(function () {
                    $.post("/" + config.lang + "/open/" + casename + "/buy/" + cases_count, function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            if (data.balance >= 0) {
                                updateBalance(data.balance);
                            }
                            location.reload();
                            try {
                                ga('newTracker.send', 'event', 'Funnel', 'Open case');
                            } catch (e) {
                                console.log('[GA] Error  ' + e.name + ":" + e.message);
                            }
                        } else {
                            openingCase = false;
                            if (data.error_message == 'need_auth') {
                                ShowNeedAuthModal();
                            } else if (data.error_message == 'need_sum') {
                                ShowAddBalanceModal(data.sum);
                            } else {
                                show_notification_error(data.error_message);
                            }
                        }
                    }, 'json');
                });
            }
        },
    });
}

function multicase_initialize() {
    pjax_fix('#multicase');
    const OPEN_MOD_SINGLE = 'single';
    const OPEN_MOD_MULTI = 'multi';
    const OPEN_MOD_RANDOM_SINGLE = 'random_single';
    const RESTORE_CASE_CELL = $('#multicase').data('restore-cell');
    const RESTORE_CELL_TIME = $('#multicase').data('restore-time') * 1000;
    window.multicase = new Vue({
        el: '#multicase',
        data: {
            total_cases: 50,
            cells_on_row: 4,
            tab: 'contains',
            open_mod: 'multi',
            open_id: 0,
            caseprice: 0,
            casename: '',
            chosen_case: 0,
            items_list: [],
            items_win_list: [],
            last_win_item: {},
            win_sum: 0,
            disabled_class: 'disabled',
            sum_text: '',
            current_id: 0,
            current_number: 0,
            try_again_single: 0,
            try_again_multi: 0,
            try_again_random: 0,
            block: 0,
            show: 0,
            in_progress: false,
        },
        created: function () {
            this.casename = $('#multicase').data('casename');
            this.caseprice = $('#multicase').data('caseprice');
            this.total_cases = $('#multicase').data('grid');
            this.cells_on_row = $('#multicase').data('cells');
            this.init_item_list();
            var self = this;
            Vue.nextTick(function () {
                if (MULTICASE_DATA.bought) {
                    self.bought_complete();
                }
                $('.multicase_top_block_case_icon .info .hellcase-btn-info').click(function () {
                    $('body').addClass('is-modal');
                    $('#overlay').show();
                    $('#case_contains').show();
                });
                $('#case_contains .close').click(function () {
                    $('body').removeClass('is-modal');
                    $('#overlay').hide();
                    $('#case_contains').hide();
                });
            })
        },
        methods: {
            bought_complete: function () {
                var self = this;
                $.post('/' + config.lang + '/multicase/bought', {
                    casename: self.casename,
                }, function (data) {
                    if (data.status === Hell.RESPONSE_STATUS_SUCCESS) {
                        multicase.open_mod = OPEN_MOD_MULTI;
                        multicase.show_win_success(data, 0);
                    }
                });
            },
            init_item_list: function () {
                for (var i = 0; i < this.total_cases; i++) {
                    var item = this.item_object();
                    item.number = i + 1;
                    this.items_list.push(item);
                }
            },
            item_object: function (item) {
                if (item === undefined) {
                    return {
                        is_board: false,
                        loading: false,
                        is_win: false,
                        open_block: false,
                        disabled: false,
                        number: 0,
                        id: 0,
                        rarity: '',
                        steam_is_stattrak: 0,
                        price: 0,
                        image: '',
                        market_hash_name: '',
                    }
                } else {
                    return {
                        is_board: item.is_board,
                        loading: item.loading,
                        is_win: item.is_win,
                        open_block: item.open_block,
                        disabled: item.disabled,
                        number: item.number,
                        id: item.id,
                        rarity: item.rarity,
                        price: item.price,
                        image: item.image,
                        steam_is_stattrak: item.steam_is_stattrak,
                        market_hash_name: item.market_hash_name,
                        weapon_name: item.weapon_name,
                        skin_name: item.skin_name,
                    }
                }
            },
            get_contract_url: function (ids) {
                if (ids.length <= 0) {
                    ids = [];
                    this.items_win_list.forEach(function (value) {
                        if (value.is_win == true) {
                            ids.push(value.id);
                        }
                    });
                    if (ids.length > 0) {
                        return '/' + config.lang + '/contract#' + ids.join(',');
                    } else {
                        return 'javascript:;';
                    }
                } else {
                    return '/' + config.lang + '/contract#' + ids;
                }
            },
            sell_items: function (ids) {
                var self = this;
                if (ids === undefined) {
                    ids = [];
                    this.items_win_list.forEach(function (item) {
                        if (item.is_win == true) {
                            ids.push(item.id);
                        }
                    });
                }
                if (ids.length > 0) {
                    $.ajax({
                        url: '/' + config.lang + '/multicase/sell_items',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            ids: ids,
                            sum: this.win_sum.toFixed(2)
                        },
                        success: function (data) {
                            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                                updateBalance(data.balance);
                                self.items_win_list.forEach(function (value) {
                                    value.is_win = false;
                                });
                                self.calculate_params();
                                ShowMsg(localization.success, localization.is_sold, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                            } else {
                                ShowMsg(localization.error, localization.sell_error, Hell.RESPONSE_STATUS_ERROR, 3000);
                            }
                        },
                        error: function () {
                            ShowMsg(localization.error, localization.unknown_error, Hell.RESPONSE_STATUS_ERROR, 3000);
                        }
                    })
                }
            },
            sell_item: function (item) {
                var id = item.id;
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/profile/sell',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id: id
                    },
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            updateBalance(data.balance);
                            item.is_win = false;
                            self.calculate_params();
                            ShowMsg(localization.success, localization.is_sold, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                        } else {
                            ShowMsg(localization.error, localization.sell_error, Hell.RESPONSE_STATUS_ERROR, 3000);
                        }
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, Hell.RESPONSE_STATUS_ERROR, 3000);
                    }
                });
            },
            get_cell_class: function (item) {
                var disabled = '';
                if (item.disabled == true) {
                    disabled = 'disabled';
                }
                if (item.is_board == false) {
                    return 'case_cell empty ' + disabled + ' cell_' + item.number;
                } else {
                    return 'case_cell flipped case_cell-item ' + disabled + ' ' + item.rarity + ' cell_' + item.number;
                }
            },
            change_mod: function (element) {
                if (this.block == 1) {
                    return;
                }
                var clicked = $(element.target.parentElement);
                if ((clicked.hasClass('multi') && clicked.hasClass('hellcase-btn-default')) || clicked.hasClass('try_again_multi')) {
                    this.set_multi_mod();
                } else if ((clicked.hasClass('single') && clicked.hasClass('hellcase-btn-default')) || clicked.hasClass('try_again_single')) {
                    this.set_single_mod();
                }
            },
            set_multi_mod: function () {
                this.init_new_case();
                this.open_mod = OPEN_MOD_MULTI;
                $('.multi').removeClass('hellcase-btn-default').addClass('hellcase-btn-success');
                $('.single').removeClass('hellcase-btn-success').addClass('hellcase-btn-default');
                $('.random_single').removeClass('hellcase-btn-success').addClass('hellcase-btn-default');
            },
            set_single_mod: function () {
                this.init_new_case();
                this.open_mod = OPEN_MOD_SINGLE;
                $('.single').removeClass('hellcase-btn-default').addClass('hellcase-btn-success');
                $('.multi').removeClass('hellcase-btn-success').addClass('hellcase-btn-default');
                $('.random_single').removeClass('hellcase-btn-success').addClass('hellcase-btn-default');
            },
            set_random_single_mod: function () {
                this.init_new_case();
                this.open_mod = OPEN_MOD_RANDOM_SINGLE;
                $('.random_single').removeClass('hellcase-btn-default').addClass('hellcase-btn-success');
                $('.single').removeClass('hellcase-btn-success').addClass('hellcase-btn-default');
                $('.multi').removeClass('hellcase-btn-success').addClass('hellcase-btn-default');
            },
            init_new_case: function () {
                this.tab = 'contains';
                this.try_again_single = 0;
                this.try_again_multi = 0;
                this.try_again_random = 0;
                this.casename = $('#multicase').data('casename');
                this.caseprice = $('#multicase').data('caseprice');
                this.total_cases = $('#multicase').data('grid');
                this.chosen_case = 0;
                this.open_id = 0;
                this.items_list = [];
                this.items_win_list = [];
                this.last_win_item = {};
                this.win_sum = 0;
                this.disabled_class = 'disabled';
                this.sum_text = '';
                this.init_item_list();
            },
            create_new_open: function () {
                var self = this;
                $.ajax({
                    type: 'POST',
                    url: '/' + config.lang + '/multicase/new_open',
                    dataType: 'json',
                    data: {
                        casename: self.casename,
                    },
                    success: function (data) {
                        if (data.status === Hell.RESPONSE_STATUS_SUCCESS) {
                            self.open_id = data.open_id;
                        } else {
                            window.location.reload();
                        }
                    },
                });
            },
            random_open_delay: function (try_again) {
                this.try_again_random = 0;
                if (this.block == 1) {
                    return;
                }
                this.set_random_single_mod();
                var self = this;
                if (try_again) {
                    setTimeout(function () {
                        self.random_open();
                    }, 1000);
                } else {
                    this.random_open();
                }
            },
            random_open: function () {
                var max = this.total_cases + 1;
                var chosen_case = Math.floor(Math.random() * (max - 1)) + 1;
                this.open_case(chosen_case);
            },
            fetch_images: function (items, cb) {
                var self = this;
                var images_loaded = 0;
                var max_items = items.length;
                if (max_items == 0) {
                    if (typeof (cb) === 'function') {
                        cb();
                    }
                    return false;
                }
                $.each(items, function (idx, item) {
                    var img = new Image();
                    img.src = item.steam_image + '/360fx360f.png';
                    img.onload = function () {
                        images_loaded = images_loaded + 1;
                        if (images_loaded === max_items) {
                            if (typeof (cb) === 'function') {
                                cb();
                            }
                            return false;
                        }
                    };
                });
            },
            open_case: function (chosen_case) {
                this.in_progress = true;
                this.block = 1;
                var key = chosen_case - 1;
                this.chosen_case = chosen_case;
                if (this.items_list[key].is_board == true || this.items_list[key].open_block == true) {
                    return;
                }
                this.items_list[key].open_block = true;
                if (this.open_mod != OPEN_MOD_RANDOM_SINGLE) {
                    this.items_list[key].loading = true;
                }
                var self = this;
                $.post('/' + config.lang + '/multicase/buy', {
                    casename: this.casename,
                    open_mod: this.open_mod,
                    open_id: this.open_id,
                    cell_number: chosen_case,
                }, function (data) {
                    if (data.status === Hell.RESPONSE_STATUS_SUCCESS) {
                        self.show_win_success(data, key);
                    } else if (data.status === Hell.RESPONSE_STATUS_ERROR) {
                        show_notification_error(data.error_message);
                    }
                });
            },
            show_win_success: function (data, key) {
                var self = this;
                self.fetch_images(data.no_win, function () {
                    self.fetch_images(data.weapons, function () {
                        updateBalance(data.balance);
                        try {
                            fbq('track', 'Purchase', {
                                value: self.caseprice,
                                currency: 'USD'
                            });
                        } catch (e) {}
                        if (data.multicase_open_id !== null) {
                            self.open_id = data.multicase_open_id;
                        }
                        if (self.open_mod === OPEN_MOD_MULTI) {
                            self.tab = 'win';
                            setTimeout(function () {
                                self.show_win_item(data, key);
                            }, 1000);
                            if (RESTORE_CASE_CELL == true) {
                                setTimeout(function () {
                                    self.items_list[key].is_board = false;
                                    self.items_list[key].open_block = false;
                                }, RESTORE_CELL_TIME);
                            } else {
                                var counter = 0;
                                self.items_list.forEach(function (val, index) {
                                    if (val.is_board == true) {
                                        counter++;
                                    }
                                });
                                if (counter == self.total_cases) {
                                    self.try_again_multi = 1;
                                }
                            }
                        } else if (self.open_mod === OPEN_MOD_SINGLE) {
                            self.try_again_single = 1;
                            self.tab = 'win';
                            self.show_all_items(data, key);
                        } else if (self.open_mod === OPEN_MOD_RANDOM_SINGLE) {
                            self.try_again_random = 1;
                            self.tab = 'win';
                            self.show_all_items(data, key);
                        }
                        self.block = 0;
                    });
                });
            },
            show_all_items: function (data, chosen_case) {
                var win_item = data.weapons[0];
                var other_items = data.no_win;
                var key = chosen_case;
                this.current_id = win_item.id;
                this.items_list[key].is_win = true;
                this.items_list[key].is_board = true;
                this.items_list[key].id = win_item.id;
                this.items_list[key].rarity = win_item.rarity.toLowerCase();
                this.items_list[key].price = win_item.steam_price_en;
                this.items_list[key].weapon_name = win_item.weapon_name;
                this.items_list[key].skin_name = win_item.skin_name;
                this.items_list[key].steam_is_stattrak = win_item.steam_is_stattrak;
                this.items_list[key].exterior = this.get_exterior(win_item.steam_exterior);
                this.items_list[key].price = win_item.steam_price_en;
                this.items_list[key].image = win_item.steam_image + '/360fx360f.png';
                var itemName = win_item.steam_market_hash_name.split("|");
                if (itemName.length > 1) {
                    itemName = itemName[0] + '<br \> ' + itemName[1];
                }
                this.items_list[key].market_hash_name = itemName;
                var self = this;
                other_items.forEach(function (item, index) {
                    if (self.items_list[index].is_win == false) {
                        self.items_list[index].is_win = false;
                        self.items_list[index].is_board = true;
                        self.items_list[index].disabled = true;
                        self.items_list[index].id = item.id;
                        self.items_list[index].exterior = self.get_exterior(item.steam_exterior);
                        self.items_list[index].rarity = item.rarity.toLowerCase();
                        self.items_list[index].price = item.steam_price_en;
                        self.items_list[index].weapon_name = item.weapon_name;
                        self.items_list[index].steam_is_stattrak = item.steam_is_stattrak;
                        self.items_list[index].skin_name = item.skin_name;
                        self.items_list[index].image = item.steam_image + '/360fx360f.png';
                        var name = item.steam_market_hash_name.split("|");
                        if (name.length > 1) {
                            name = name[0] + '<br \> ' + name[1];
                        }
                        self.items_list[index].market_hash_name = name;
                    }
                });
                this.last_win_item = self.items_list[key];
                var self = this;
                setTimeout(function () {
                    self.items_win_list.push(self.last_win_item);
                }, 1000);
                this.calculate_params();
                casename = this.casename;
                cases_count = 1;
                casePrice = this.caseprice;
                category = '';
                setTimeout(function () {
                    universal_item_modal([win_item], {
                        event_tokens: [],
                        try_again_cb: function () {
                            self.init_new_case();
                            window.win_item_modal_once.hide();
                        }
                    }, {
                        event_show: false,
                        btn_try: true,
                        btn_my: true,
                        btn_sell: true,
                        btn_up: true,
                        btn_cb: true,
                        hotkeys: true,
                        share: true
                    });
                }, 1500);
            },
            show_win_item: function (data, chosen_case) {
                var item = data.weapons[0];
                var key = chosen_case;
                this.current_id = item.id;
                this.items_list[key].is_win = true;
                this.items_list[key].loading = false;
                this.items_list[key].is_board = true;
                this.items_list[key].id = item.id;
                this.items_list[key].rarity = item.rarity;
                this.items_list[key].price = item.steam_price_en;
                this.items_list[key].weapon_name = item.weapon_name;
                this.items_list[key].skin_name = item.skin_name;
                this.items_list[key].exterior = this.get_exterior(item.steam_exterior);
                this.items_list[key].image = item.steam_image + '/360fx360f.png';
                var itemName = item.steam_market_hash_name.split("|");
                if (itemName.length > 1) {
                    itemName = itemName[0] + '<br \> ' + itemName[1];
                }
                this.items_list[key].market_hash_name = itemName;
                this.last_win_item = this.items_list[key];
                var item = this.item_object(this.last_win_item);
                var self = this;
                setTimeout(function () {
                    self.items_list[key].loading = false;
                    self.items_win_list.push(item);
                }, 1000);
                this.calculate_params();
                casename = this.casename;
                cases_count = 1;
                casePrice = this.caseprice;
                category = '';
                self.in_progress = false;
            },
            modal_settings: function () {
                var self = this;
                $("#overlay").off();
                $("#overlay").click(function () {
                    hide_overlay();
                });
                $(".tryagain").off();
                $(".tryagain").click(function () {
                    self.init_new_case();
                    hide_overlay();
                });
                $(".sell").off();
                $(".sell").click(function () {
                    self.sell_item(self.last_win_item);
                    hide_overlay();
                });
            },
            calculate_params: function () {
                var self = this;
                self.win_sum = 0;
                self.items_win_list.forEach(function (item) {
                    if (item.is_win == true) {
                        self.win_sum += parseFloat(item.price);
                        self.win_sum = Math.round(self.win_sum * 100) / 100
                    }
                });
                if (self.win_sum > 0) {
                    self.disabled_class = '';
                    self.sum_text = '($' + this.win_sum + ')';
                } else {
                    self.disabled_class = 'disabled';
                    self.sum_text = '';
                }
            },
            get_exterior: function (ex) {
                var arr = ex.match(/([A-Z])/g);
                if (arr == null || arr.length == 0) return '';
                return arr.join('');
            },
            round_price: function (price) {
                return currency_calc_amount(parseFloat(price));
            },
        },
    });
}

function premium() {
    pjax_fix('#premium_page');
    window.premium_page = new Vue({
        el: '#premium_page',
        data: {
            case_type: config.PROJECT,
            case_types: [],
            hide_type: null,
            giveaways: [],
            checked_profile_hide: false,
            checked_premium_hide: false,
            checked_auto_renewal: false,
            cases: [],
            history: [],
            current_gw: null,
            status: '',
            partner: [],
            days_left: 0,
            HIDE_PREM_DEFAULT: 0,
            HIDE_PREM_ACCOUNT: 1,
            HIDE_PREM_STATUS: 2,
            HIDE_PREM_ACCOUNT_AND_STATUS: 3
        },
        created: function () {
            this.get_premium_data();
        },
        methods: {
            give_type_info: function (type_info, type) {
                type_css = (type == 'day') ? 'daily' : type + 'ly';
                var info = {
                    type: type_css,
                    text: {
                        day: localization.prem_daily_text,
                        week: localization.prem_weekly_text,
                        month: localization.prem_monthly_text
                    },
                    css_color: {
                        day: 'green',
                        week: 'purple',
                        month: 'violet',
                    },
                    css_type: {
                        day: type_css + '-giveaway_bg',
                        week: type_css + '-giveaway_bg',
                        month: type_css + '-giveaway_bg',
                    }
                };
                return info[type_info][type];
            },
            set_auto_renewal: function () {
                var self = this;
                if (self.checked_auto_renewal) {
                    if (confirm('Cancel auto renewal?')) {
                        $.get('/' + config.lang + '/profile/cancel_self_subs', function (res) {
                            self.checked_auto_renewal = !self.checked_auto_renewal;
                        });
                    }
                } else {
                    $.get('/' + config.lang + '/profile/enable_self_subs', function (res) {
                        self.checked_auto_renewal = !self.checked_auto_renewal;
                    });
                }
            },
            hide_premium: function () {
                var hide_type = this.HIDE_PREM_DEFAULT;
                this.checked_premium_hide = !this.checked_premium_hide;
                if (this.checked_premium_hide && this.checked_profile_hide) hide_type = this.HIDE_PREM_ACCOUNT_AND_STATUS;
                if (this.checked_premium_hide && !this.checked_profile_hide) hide_type = this.HIDE_PREM_STATUS;
                if (!this.checked_premium_hide && this.checked_profile_hide) hide_type = this.HIDE_PREM_ACCOUNT;
                this.hide_type = hide_type;
                set_profile_state(hide_type);
            },
            hide_profile: function () {
                var hide_type = this.HIDE_PREM_DEFAULT;
                this.checked_profile_hide = !this.checked_profile_hide;
                if (this.checked_premium_hide && this.checked_profile_hide) hide_type = this.HIDE_PREM_ACCOUNT_AND_STATUS;
                if (this.checked_premium_hide && !this.checked_profile_hide) hide_type = this.HIDE_PREM_STATUS;
                if (!this.checked_premium_hide && this.checked_profile_hide) hide_type = this.HIDE_PREM_ACCOUNT;
                this.hide_type = hide_type;
                set_profile_state(hide_type);
            },
            set_checked: function (hide_type) {
                if (hide_type == 1 || hide_type == 3) {
                    this.checked_profile_hide = true;
                }
                if (hide_type == 2 || hide_type == 3) {
                    this.checked_premium_hide = true;
                }
            },
            set_giveaways: function (giveaways) {
                if (!giveaways) {
                    return;
                }
                this.giveaways = giveaways;
                this.giveaways.forEach(function (giveaway) {
                    var minutes = Math.floor(giveaway.seconds / 60);
                    giveaway['minutes_left'] = minutes;
                    giveaway['seconds_left'] = (giveaway.seconds / 60 - minutes) * 60;
                });
                this.set_timeout(this.giveaways);
            },
            set_timeout: function (giveaways) {
                Vue.nextTick(function () {
                    $.each(giveaways, function (index, item) {
                        var local = moment(moment.utc(item.finish).toDate()).format('YYYY-MM-DD HH:mm:ss');
                        $("#timer" + item.id).countdown(local, function (event) {
                            var format = "%H:%M:%S";
                            if (item.type == "day") {
                                format = "<span class='timer-green_text'>%H</span> hr <span class='timer-green_text'>%M</span> min";
                            }
                            if (item.type == "week" || item.type == "month") {
                                format = "<span class='timer-green_text'>%M</span> min <span class='timer-green_text'>%S</span> sec";
                                if (event.offset.totalHours > 0) {
                                    format = "<span class='timer-green_text'>%H</span> hr <span class='timer-green_text'>%M</span> min";
                                }
                                if (event.offset.totalDays > 0) {
                                    format = "<span class='timer-green_text'>%-D</span> day%!D";
                                }
                            }
                            var result = '<span :class="\'light-\'+give_type_info(\'css_color\',giveaway.type)+\'_text\'">' + localization.time_left + ': </span>' + format;
                            $(this).html(event.strftime(result));
                        });
                    });
                });
            },
            open_history: function (gw) {
                var self = this;
                this.history = {
                    history: [],
                    historyOwn: []
                };
                $.ajax({
                    url: "/" + config.lang + "/giveaway/history/" + gw.type + '/' + gw.gw_id,
                    dataType: "json",
                    method: "POST"
                }).success(function (data) {
                    if (data.status == "success") {
                        self.history = data;
                        self.current_gw = gw;
                        self.status = gw.joined.status;
                        var local = moment(moment.utc(gw.finish).toDate()).format('YYYY-MM-DD HH:mm:ss');
                        var seconds = gw.seconds;
                        Vue.nextTick(function () {
                            $("#timer_modal" + gw.id).countdown(local, function (event) {
                                var format = "%H:%M:%S";
                                var piece = 100 / seconds;
                                var percent = (piece * (seconds - event.offset.totalSeconds)).toFixed(2);
                                $("#fill" + gw.id).css({
                                    'width': percent + '%'
                                });
                                if (gw.type == "day") {
                                    format = "<span class='timer-green_text'>%H</span> hr <span class='timer-green_text'>%M</span> min";
                                }
                                if (gw.type == "week" || gw.type == "month") {
                                    format = "<span class='timer-green_text'>%M</span> min <span class='timer-green_text'>%S</span> sec";
                                    if (event.offset.totalHours > 0) {
                                        format = "<span class='timer-green_text'>%H</span> hr <span class='timer-green_text'>%M</span> min";
                                    }
                                    if (event.offset.totalDays > 0) {
                                        format = "<span class='timer-green_text'>%-D</span> day%!D";
                                    }
                                }
                                var result = '<span class="time-left" :class="\'light-\'+give_type_info(\'css_color\',giveaway.type)+\'_text\'">' + localization.time_left + ': </span>' + format;
                                $(this).html(event.strftime(result));
                            });
                        });
                        Vue.nextTick(function () {
                            show_overlay();
                            $("body").addClass("is-modal");
                            $('#give_modal').show();
                            $("#give_modal .close, .h-giveaway-modal-close,#overlay,.h-giveaway-modal-close a").one("click", function () {
                                $('#give_modal').hide();
                                hide_overlay();
                                self.current_gw = null;
                            });
                            $(window).on('popstate', function () {
                                $('#give_modal').hide();
                                hide_overlay();
                                self.current_gw = null;
                            });
                        });
                        return false;
                    } else {
                        return ShowMsg(localization.error, localization.unknown_error, "fail", 3000);
                    }
                }).error(function () {
                    return ShowMsg(localization.error, localization.unknown_error, "fail", 3000);
                });
            },
            get_premium_data: function () {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/main_page/get_premium_data',
                    type: 'POST',
                    dataType: 'json',
                    success: function (data) {
                        if (data.status === Hell.RESPONSE_STATUS_SUCCESS) {
                            var premium_data = data.data;
                            self.case_types = Object.keys(premium_data.cases);
                            self.cases = premium_data.cases;
                            self.hide_type = premium_data.hide_type;
                            self.set_checked(premium_data.hide_type);
                            self.set_giveaways(premium_data.giveaways);
                            self.days_left = premium_data.days_left;
                            self.checked_auto_renewal = (premium_data.is_renewal == "1");
                            self.partner = premium_data.partner;
                        } else {
                            show_notification_error(data.error_message);
                        }
                    },
                    error: function () {
                        show_notification_error(data.error_message);
                    }
                })
            }
        }
    });
}

function show_add_wallet(selectize) {
    if (window.add_wallet_html !== undefined) {
        $('#add_wallet').html(window.add_wallet_html);
    } else {
        window.add_wallet_html = $('#add_wallet').html();
    }
    window.add_wallet = new Vue({
        el: '#add_wallet',
        data: {
            payment: window.payout.payment,
            wallet: '',
            name: '',
            validate_wallet: false,
            validate_name: false,
        },
        created: function () {
            $('#payout').hide();
            $('#add_wallet').show();
        },
        computed: {
            placeholder: function () {
                if (this.payment === 'bitcoin') {
                    return '1KxdY3k...';
                }
                if (this.payment === 'ethereum') {
                    return '0xabc1234...';
                }
                return '';
            }
        },
        methods: {
            validateWallet: function () {
                var selector = '#input_wallet_address';
                var pattern = '';
                if (this.payment === 'bitcoin') {
                    pattern = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/gi;
                } else if (this.payment === 'ethereum') {
                    pattern = /^0x[a-fA-F0-9]{40}$/;
                }
                if (this.wallet.match(pattern) === null) {
                    $(selector).css('border', '1px solid rgb(144, 27, 26)');
                    this.validate_wallet = false;
                    return false;
                } else {
                    $(selector).css('border', '1px solid rgb(48, 107, 39)');
                    this.validate_wallet = true;
                    return true;
                }
            },
            validateName: function () {
                var selector = '#input_wallet_name';
                var pattern = /^[a-zA-Z0-9_.-]{1,40}$/gi;
                if (this.name.match(pattern) === null) {
                    $(selector).css('border', '1px solid rgb(144, 27, 26)');
                    this.validate_name = false;
                    return false;
                } else {
                    $(selector).css('border', '1px solid rgb(48, 107, 39)');
                    this.validate_name = true;
                    return true;
                }
            },
            addNewWallet: function () {
                if (!this.validate_wallet || !this.validate_name) {
                    ShowMsg(localization.error, 'Wrong format of wallet address or name', 'error', 3000);
                    return false;
                }
                if (typeof (selectize) != 'undefined') {
                    selectize.addOption({
                        value: this.wallet,
                        text: this.wallet,
                        name: this.name,
                        confirmed: false
                    });
                    selectize.refreshOptions();
                    selectize.close();
                }
                window.payout.bills.push({
                    payment_system: this.payment,
                    bill: this.wallet,
                    bill_name: this.name
                });
                if (typeof (window.payout.current_bill.bill) == 'undefined') {
                    window.payout.current_bill = {
                        payment_system: this.payment,
                        bill: this.wallet,
                        bill_name: this.name
                    };
                }
                this.previousModal();
            },
            previousModal: function () {
                $('#add_wallet').hide();
                $('#payout').show();
            }
        }
    });
}

function open_trade_offer_access_url() {
    window.open(`https://steamcommunity.com/id/me/tradeoffers/privacy#trade_offer_access_url`, 'Steam Privacy Settings', 'width = 800 height = 350');
    return false;
}

function remove_wallet(selectize, wallet) {
    $.post('/' + config.lang + '/profile/remove_wallet', {
        wallet: wallet
    }, function () {
        selectize.removeOption(wallet, false);
        selectize.refreshOptions();
    });
}
const PAYOUT_TYPE_ITEMS = 'items';
const PAYOUT_TYPE_BALANCE = 'balance';

function show_payout(default_sum_amount) {
    if (default_sum_amount === undefined) {
        default_sum_amount = 15;
    }
    show_overlay();
    if (window.payout_html != undefined) {
        $('#payout').html(window.payout_html);
        if (typeof (window.csrf_token) !== 'undefined') {
            $('#payout input[type=hidden]').val(window.csrf_token);
        }
    } else {
        window.payout_html = $('#payout').html();
    }
    window.payout = new Vue({
        el: '#payout',
        data: {
            min_prices: {},
            user_balance: 0,
            payment: 'ethereum',
            payment_currency: 'ethereum',
            disabled_payment: [],
            wallet: '',
            amount: default_sum_amount,
            name: '',
            bills: [],
            selectize: {},
            bitcoin_selectize: '',
            ethereum_selectize: '',
            bitskins_selectize: '',
            is_bitcoin: 0,
            is_ethereum: 0,
            is_bitskins: 0,
            is_hidden_modal: 0,
            g2a_uid: '',
            is_mobile: isMobile,
            hell_select_list: false,
            current_bill: false
        },
        created: function () {
            this.get_bills();
            var self = this;
            this.getUserBalance(function (data) {
                self.user_balance = data.balance;
                $.each(self.min_prices, function (key, value) {
                    if (self.user_balance < value) {
                        self.disabled_payment[key] = true;
                        $('.sort_' + key + ' a').addClass('disabled');
                    }
                });
            });
            $('#payout').show();
            this.min_prices = $('#payout').data('min');
            this.g2a_uid = $('#payout').data('guid');
            var payments_sorted_by_min = Object.keys(this.min_prices).sort(function (a, b) {
                return self.min_prices[a] - self.min_prices[b]
            });
            payments_sorted_by_min.forEach(function (value, key) {
                var cl = $('.sort_' + value).detach();
                $('.payout-content ul').append(cl);
            });
            Vue.nextTick(function () {
                $(document).click(function (event) {
                    if ($(event.target).closest(".hell-select input,.hell-select-placeholder").length) return;
                    $('.hell-select').removeClass('open');
                    self.hell_select_list = false;
                    event.stopPropagation();
                });
                $('#overlay, #payout .close').click(function () {
                    if (self.is_hidden_modal === 0) {
                        $('#payout').hide();
                    }
                    hide_overlay();
                });
                $('.payout-amount p a strong').click(function () {
                    window.payout.amount = Number($(this).text());
                });
            });
            this.check_price();
        },
        computed: {
            min_amount: function () {
                if (this.min_prices[this.payment] !== undefined) {
                    return this.min_prices[this.payment].toFixed(2);
                }
                return 0;
            },
            bills_list: function () {
                var self = this;
                return this.bills.filter(function (b) {
                    return b.payment_system == self.payment;
                });
            },
            is_can_send: function () {
                if (this.payment == 'g2a' && this.g2a_uid == '') {
                    return false;
                }
                var max = $('#payout #amount').data('max');
                var min = this.min_prices[this.payment];
                var amount = parseFloat(this.amount);
                if (amount < min) {
                    return false;
                }
                if (amount > max) {
                    return false;
                }
                return true;
            }
        },
        watch: {
            amount: function (val1, val2) {
                if (val1 == val2) {
                    return false;
                }
                this.check_price();
            },
            payment: function (val1, val2) {
                if (val1 == val2) {
                    return false;
                }
                this.wallet = '';
                this.current_bill = {};
                var amount = parseFloat(this.amount);
                var min = this.min_prices[val1];
                if (amount < min) {
                    this.amount = min;
                }
                this.check_price();
            },
            current_bill: function (val) {
                if (typeof (val.bill) != 'undefined' && val.payment_system == this.payment) {
                    this.wallet = val.bill;
                    this.name = val.bill_name;
                } else {
                    this.wallet = '';
                    this.name = '';
                }
            }
        },
        methods: {
            is_bills(data) {
                var self = this;
                var count = 0;
                for (var i = 0; i < self.bills.length; i++) {
                    if (self.bills[i] != 'undefined' && self.bills[i].payment_system == data) {
                        count++;
                    }
                }
                if (count > 0) {
                    return true;
                } else {
                    return false;
                }
            },
            removeBill(data) {
                if (this.bills[data].bill == this.current_bill.bill) {
                    this.current_bill = false;
                }
                this.bills.splice(data, 1);
            },
            set_payment(name, currency) {
                var self = this;
                this.payment = name;
                this.payment_currency = currency;
                this.getWalletName();
            },
            getUserBalance: function (cb) {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/profile/balance',
                    type: 'POST',
                    success: cb
                });
            },
            show_add_wallet: function () {
                show_add_wallet(this.selectize[this.payment]);
            },
            getWalletName: function () {
                if (typeof (this.selectize[this.payment]) != 'undefined') {
                    if (this.wallet === '') {
                        this.wallet = this.selectize[this.payment].getValue();
                    }
                    var self = this;
                    setTimeout(function () {
                        self.selectize[self.payment].close();
                    }, 0);
                    this.name = $(self.selectize[self.payment].getOption(this.wallet)).find('#wallet-name').text();
                    if (this.name === 'No name') {
                        this.name = '';
                    }
                }
            },
            validate_wallet: function () {
                var selector = '.hell-select';
                var pattern = '';
                if (this.payment === 'g2a') {
                    return true;
                }
                if (this.payment === 'bitcoin') {
                    pattern = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/gi;
                } else if (this.payment_currency === 'ethereum') {
                    pattern = /^0x[a-fA-F0-9]{40}$/;
                }
                if (this.wallet.match(pattern) === null) {
                    $(selector).removeClass('success');
                    $(selector).addClass('danger');
                    return false;
                } else {
                    $(selector).removeClass('danger');
                    $(selector).addClass('success');
                    return true;
                }
                return false;
            },
            get_bills: function () {
                var self = this;
                $.post('/' + config.lang + '/profile/get_user_bills', {}, function (data) {
                    data.forEach(function (value, key) {
                        if (value.payment_system === 'bitcoin') {
                            self.is_bitcoin = 1;
                        }
                        if (value.payment_system === 'ethereum') {
                            self.is_ethereum = 1;
                        }
                        if (value.payment_system === 'bitskins') {
                            self.is_bitskins = 1;
                        }
                    });
                    self.bills = data;
                    Vue.nextTick(function () {
                        $('.payout-amount select').selectize({
                            create: false,
                            maxOptions: 6,
                            sortField: [{
                                field: 'type',
                                direction: 'asc'
                            }, {
                                field: 'sort',
                                direction: 'desc'
                            }, {
                                field: '$score'
                            }],
                            render: {
                                option: function (item, escape) {
                                    var conf_class = 'confirmed';
                                    var conf_text = 'Confirmed';
                                    var name = item.name;
                                    if (name === '') {
                                        name = 'No name';
                                    }
                                    if (!item.confirmed) {
                                        conf_class = 'not-confirmed';
                                        conf_text = 'Not confirmed';
                                    }
                                    if (item.value === 'button') {
                                        return '<div id="option-root" class="payout_add_wallet">' +
                                            '<span id="wallet-button-text">+ Add new Wallet</span>' +
                                            '<div id="wallet-button" class="option-button"></div>' +
                                            '</div>';
                                    }
                                    return '<div id="option-root">' +
                                        '<div id="wallet-name">' + escape(name) + '</div>' +
                                        '<div id="wallet-text">' + item.text + '</div>' +
                                        '<span id="wallet-' + conf_class + '">' + conf_text + ' <span class="remove"><i class="fa fa-trash" aria-hidden="true"></i></span></span>' +
                                        '</div>';
                                }
                            },
                            onInitialize: function () {
                                var class_split = this.$input.attr('class').split('_')[0];
                                self.selectize[class_split] = this;
                            },
                            onChange: function (value) {
                                self.name = $(this.getOption(value)).find('#wallet-name').text();
                                self.wallet = value;
                                self.validate_wallet();
                            }
                        });
                    });
                });
            },
            show_bitskins: function () {
                $('#payout').hide();
                var self = this;
                payout_model.show.instructions('show_bitskins');
                show_overlay();
                self.is_hidden_modal = 1;
                $('#overlay, .instruction-modal .close, .back-title').click(function () {
                    setTimeout(function () {
                        if (self.is_hidden_modal === 1) {
                            $('#payout').show();
                            show_overlay();
                            self.is_hidden_modal = 0;
                        }
                    }, 200);
                });
            },
            check_price: function () {
                var max = $('#payout #amount').data('max');
                var min = this.min_prices[this.payment];
                var amount = parseFloat(this.amount);
                if (this.balance <= amount) {
                    amount = this.balance;
                }
                if (amount > max) {
                    return false;
                }
                if (amount < min) {
                    ShowMsg(localization.error, localization.profile_withdraw_min_price.format(min), 'error', 3000);
                    return false;
                }
                if (isNaN(amount)) {
                    amount = min;
                } else {
                    amount = amount.toFixed(2);
                    if (amount > max) {
                        amount = max;
                    }
                    if (amount == 0 || amount == '') {
                        amount = min;
                    }
                }
                this.amount = Number(amount);
            },
            send: function () {
                if (!this.validate_wallet()) {
                    return false;
                }
                if (this.name === '') {
                    this.getWalletName();
                }
                if (!this.is_can_send) {
                    return false;
                }
                var wallet = this.current_bill.bill;
                var wallet_name = this.current_bill.bill_name;
                if (this.payment == 'g2a') {
                    wallet = '';
                    wallet_name = '';
                }
                var pay_type = this.payment;
                var payout_type = this.payout_type;
                var sum = this.amount;
                var min_sum = this.min_prices[this.payment];
                var max_sum = $('#payout #amount').data('max');
                var token = $('#payout input[type=hidden]').val();
                if (sum >= min_sum && sum | 0 > 0 && sum <= max_sum && pay_type != '') {
                    $.post('/' + config.lang + '/profile/payout', {
                        "payment": pay_type,
                        payout_type: payout_type,
                        amount: sum,
                        wallet: wallet,
                        wallet_name: wallet_name,
                        _token: token
                    }, function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            updateBalance(data.balance);
                            $('#payout').hide();
                            if (data.confirmed == 0) {
                                payout_model.show.check_email();
                            } else {
                                ShowMsg(localization.success, localization[data.message], Hell.RESPONSE_STATUS_SUCCESS, 3000);
                                hide_overlay();
                            }
                        } else {
                            show_notification_error(data.error_message);
                        }
                        if (data.token != null) {
                            window.csrf_token = data.token;
                            $('#payout input[type=hidden]').val(data.token);
                        }
                    });
                } else {
                    $('#payout #amount').focus();
                }
            },
            show_instruction: function () {
                $('#payout').hide();
                var self = this;
                payout_model.show.instructions();
                show_overlay();
                self.is_hidden_modal = 1;
                window.payout_instruction.required_confirm = false;
                $('#overlay, .instruction-modal .close, .back-title:not(.back-to-instructions)').click(function () {
                    setTimeout(function () {
                        if (self.is_hidden_modal === 1) {
                            $('#payout').show();
                            show_overlay();
                            self.is_hidden_modal = 0;
                        }
                    }, 200);
                });
            }
        }
    });
}

function save_trade_link(trade_url, success, failure) {
    $.post("/" + config.lang + "/profile/settradelink", {
        link: trade_url
    }, function (data) {
        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
            success(data);
        } else {
            failure(data);
        }
    }, 'json');
}

function show_history() {
    show_overlay();
    if (window.history_html != undefined) {
        $('#history').html(window.history_html);
    } else {
        window.history_html = $('#history').html();
    }
    window.history_ = new Vue({
        el: '#history',
        data: {
            section: 'history',
            transactions: [],
            lang: localization,
            payouts: []
        },
        created: function () {
            var self = this;
            $.getJSON('/' + config.lang + '/profile/history', function (data) {
                self.transactions = data.history;
                self.payouts = data.payout;
                $('.modal#history').show();
            });
        },
        methods: {
            sum_abs: function (sum) {
                return '<i class="cur success" ' + set_data_before() + '></i>' + currency_calc_amount(Math.abs(sum));
            },
            time_html: function (time_updated) {
                return time_updated.replace(' ', ' <span>') + '</span>';
            },
            reject: function (row) {
                var self = this;
                $.post('/' + config.lang + '/profile/payout_reject/' + row.id, function (data) {
                    $.getJSON('/' + config.lang + '/profile/history', function (data) {
                        self.transactions = data.history;
                        self.payouts = data.payout;
                    });
                });
            },
            close: function () {
                $('#history').fadeOut('fast');
                hide_overlay();
            }
        }
    });
}

function show_add_email_modal() {
    show_overlay();
    $('.add_email_modal').fadeIn('fast');
    $('#overlay').one('click', function () {
        $('.add_email_modal').fadeOut('slow');
    });
}

function show_exchange_modal(caseopens_id, weapon, weapons, item_obj, available_methods) {
    show_overlay();
    pjax_fix('#replace-item-popup');
    const PROJECT_CSGO = 'csgo';
    const PROJECT_DOTA = 'dota2';
    const PROJECT_VGO = 'vgo';
    const PROJECT_GAMES = 'games';
    const PROJECT_CASHOUT = 'cashout';
    const PROJECT_DELAYED = 'delayed';
    if (!weapons) {
        weapons = [];
    }
    window.exchange_modal = new Vue({
        el: '#replace-item-popup',
        data: {
            show: 1,
            step: 1,
            item: weapon,
            exchange_items: weapons,
            caseopens_id: caseopens_id,
            selected_item: {},
            selected_item_id: 0,
            project: null,
            projects: new Set([PROJECT_CASHOUT]),
            lock: false,
            item_obj: item_obj,
            available_methods: available_methods,
            is_cashout: false,
            is_delayed: false,
            delayed_active: false,
            delayed_interval_id: null,
            delayed_id: 0,
            delayed_error: null,
            is_lock: false,
            disabled_projects: {
                csgo: true,
                dota: true,
                vgo: true,
                games: true,
                cashout: false,
            },
            exchange_settings: {
                money_return_diff: false,
                max_free_percent: 10,
            }
        },
        computed: {
            can_send: function () {
                if (this.selected_item_id === 0) return false;
                if (this.lock) return false;
                return true;
            },
        },
        created: function () {
            $('#replace-item-popup').show();
            var self = this;
            $("#overlay").click(function () {
                self.close();
            });
            if (this.exchange_items.length > 0) {
                this.check_disabled_project();
            }
            if (this.projects.size == 1 && this.in_project(PROJECT_CASHOUT)) {
                this.is_cashout = true;
            }
            $.ajax({
                url: '/profile/get_exchange_settings',
                success: function (data) {
                    if (data.status === Hell.RESPONSE_STATUS_SUCCESS) {
                        Vue.set(self, 'exchange_settings', data.exchange_settings);
                    }
                }
            });
        },
        methods: {
            isMoreThanMax: function (ex_item) {
                if (this.exchange_settings.money_return_diff) {
                    return false;
                }
                return ex_item.steam_price_en / this.item.win_price * 100 - 100 > this.exchange_settings.max_free_percent;
            },
            nextStep: function () {
                this.step = 2;
            },
            prevStep: function () {
                this.step = 1;
            },
            toggle_project: function (name) {
                if (this.in_project(name)) {
                    if (this.projects.size == 1 && this.in_project(PROJECT_CASHOUT)) {
                        return false;
                    }
                    this.projects.delete(name);
                } else {
                    this.projects.add(name);
                }
                if (this.projects.size == 1 && this.in_project(PROJECT_CASHOUT)) {
                    this.is_cashout = true;
                } else {
                    this.is_cashout = false;
                }
                if (this.projects.size == 1 && this.in_project(PROJECT_DELAYED)) {
                    this.is_delayed = true;
                } else {
                    this.is_delayed = false;
                }
                if (this.projects.size == 0) {
                    this.projects.add(PROJECT_CASHOUT);
                }
                this.selected_item_id = 0;
                this.selected_item = {};
                this.$forceUpdate();
            },
            in_project: function (name) {
                return this.projects.has(name);
            },
            check_disabled_project: function () {
                var self = this;
                this.exchange_items.forEach(function (val) {
                    if (val.project === PROJECT_CSGO) {
                        self.disabled_projects.csgo = false;
                        self.projects.add(PROJECT_CSGO);
                    } else if (val.project === PROJECT_DOTA) {
                        self.disabled_projects.dota = false;
                        self.projects.add(PROJECT_DOTA);
                    } else if (val.project === PROJECT_VGO) {
                        self.disabled_projects.vgo = false;
                        self.projects.add(PROJECT_VGO);
                    } else if (val.project === PROJECT_GAMES) {
                        self.disabled_projects.games = false;
                        self.projects.add(PROJECT_GAMES);
                    }
                });
                this.$forceUpdate();
            },
            close: function () {
                var self = this;
                hide_overlay();
                $('#replace-item-popup').hide();
                if (typeof (self.item_obj) === 'function') {
                    self.item_obj([], 'close');
                }
                $("#overlay").off();
                $("#overlay").click(function () {
                    hide_overlay();
                });
            },
            no_thanks: function () {
                var self = this;
                hide_overlay();
                $('#replace-item-popup').hide();
                $.post("/" + config.lang + "/profile/cancel_exchange", {
                    caseopens_id: self.caseopens_id,
                }, function (data) {
                    if (data.status === Hell.RESPONSE_STATUS_SUCCESS && typeof (self.item_obj) !== 'function') {
                        self.item_obj.find('.status').html(localization.sending_error).show();
                        self.item_obj.find('.send').hide();
                        self.item_obj.find('.sell').show();
                        self.item_obj.find('.contract-btn').show();
                        self.item_obj.find('.upgrade-btn').show();
                        self.item_obj.find('.price').hide();
                    }
                    if (typeof (self.item_obj) === 'function') {
                        self.item_obj(data, 'close');
                    }
                    $("#overlay").off();
                    $("#overlay").click(function () {
                        hide_overlay();
                    });
                });
            },
            refresh_alternative: function () {
                var self = this;
                this.selected_item_id = 0;
                this.project = null;
                $.post("/" + config.lang + "/profile/refresh_alternative", {
                    id: this.selected_item_id,
                    caseopens_id: self.caseopens_id,
                }, function (data) {
                    if (data.status && data.status === 'exchange' && data.weapons_list) {
                        self.exchange_items = data.weapons_list;
                    }
                });
            },
            sell_item: function (callback) {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/profile/sell_cashout',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id: this.item.id
                    },
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            updateBalance(data.balance);
                            if (typeof (self.item_obj) != 'function') {
                                self.item_obj.find('.send').remove();
                                self.item_obj.find('.sell').remove();
                                self.item_obj.find('.take_game').remove();
                                self.item_obj.parent().find('.contract-btn').remove();
                                self.item_obj.parent().find('.upgrade-btn').remove();
                                self.item_obj.parent().addClass('sold');
                                self.item_obj.find('.status').html(localization.item_state_15).show();
                                self.item_obj.find('.price').show();
                            }
                            if (typeof (self.item_obj) == 'function') {
                                self.item_obj(data, 'sell');
                            }
                            window.profile.get_items();
                            callback();
                            ShowMsg(localization.success, localization.is_sold, 'success', 3000);
                        } else {
                            ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                        }
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                })
            },
            select_item(el) {
                if (el === 'cashout') {
                    this.selected_item = {
                        project: el
                    };
                    this.selected_item_id = el;
                    return true;
                }
                if (this.selected_item_id == el.id) {
                    this.selected_item_id = 0;
                    this.selected_item = {};
                } else {
                    this.selected_item = el;
                    this.selected_item_id = el.id;
                }
            },
            get_exterior: function (ex) {
                if (typeof (ex) != 'string') return '';
                var arr = ex.match(/([A-Z])/g);
                if (arr == null || arr.length == 0) return '';
                return arr.join('');
            },
            send: function () {
                var self = this;
                if (this.selected_item_id == 'cashout') {
                    this.sell_item(function () {
                        $('#replace-item-popup').hide();
                        show_payout(self.item.win_price, PAYOUT_TYPE_ITEMS);
                    });
                    return false;
                }
                if (this.selected_item_id == 0) {
                    return false;
                }
                if (this.lock) {
                    return false;
                }
                this.lock = true;
                $.post("/" + config.lang + "/profile/send_exchange", {
                    id: this.selected_item_id,
                    project: this.selected_item.project,
                    caseopens_id: self.caseopens_id
                }, function (data) {
                    if (typeof (self.item_obj) === 'function') {
                        self.item_obj(data, 'send');
                    }
                    if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                        hide_overlay();
                        $('#replace-item-popup').hide();
                        window.profile.get_items();
                        if (typeof (self.item_obj) != 'function') {
                            self.item_obj.find('.status').html(localization.item_state_18).show();
                        }
                        if (data.tradeofferid !== null) {
                            $("[data-id=" + self.caseopens_id + "]").find('.get a').attr('href', 'https://steamcommunity.com/tradeoffer/' + data.tradeofferid);
                            $("[data-id=" + self.caseopens_id + "]").find('.get').show();
                            ShowMsg(localization.success, localization.take_item, Hell.RESPONSE_STATUS_SUCCESS, 10000);
                        } else {
                            if (self.project == 'games') {
                                ShowMsg(localization.success, localization.exchange_game, Hell.RESPONSE_STATUS_SUCCESS, 100000000);
                            } else {
                                ShowMsg(localization.success, localization.exchange.format(data.info.project), Hell.RESPONSE_STATUS_SUCCESS, 10000);
                            }
                        }
                    } else {
                        hide_overlay();
                        $('#replace-item-popup').hide();
                        if (data.type == 'steam' && typeof (data.error_message) == 'string') {
                            if (data.error_message.search('(15)') > 0) {
                                ShowMsg(localization.error, localization.trade_error_15, 'error', 10000);
                            } else {
                                show_notification_error(data.error_message);
                            }
                        } else {
                            if (typeof (data.should_refill) != 'undefined' && data.should_refill == true) {
                                ShowMsg(localization.error, localization[data.error_message].format(data.need_sum), 'error', 10000);
                                return true;
                            }
                            if (typeof (data.error_message) != 'undefined' && data.error_message == 'need_sum') {
                                ShowMsg(localization.error, localization[data.error_message].format(data.sum), 'error', 10000);
                                return true;
                            }
                            show_notification_error(data.error_message);
                        }
                    }
                });
            },
            withdraw: function (confirm_text) {
                var self = this;
                if (confirm(confirm_text) == true) {
                    this.sell_item(function () {
                        $('#replace-item-popup').hide();
                        show_payout(self.item.win_price, PAYOUT_TYPE_ITEMS);
                    });
                }
            },
            check_delayed: function () {
                var self = this;
                self.step = 2;
                if (this.is_lock == false) {
                    this.is_lock = true;
                    self._check_delayed();
                    setTimeout(function () {
                        self.is_lock = false;
                    }, 20000);
                } else {}
            },
            _check_delayed: function () {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/profile/is_delayed_active',
                    type: 'POST',
                    dataType: 'json',
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.step = 2;
                            self.delayed_active = true;
                            self.delayed_error = null;
                            self.delayed();
                        } else {
                            if (localization[data.error_message] != undefined) {
                                self.delayed_error = localization[data.error_message];
                            } else {
                                self.delayed_error = data.error_message;
                            }
                            self.step = 2;
                            self.delayed_active = false;
                        }
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                });
            },
            delayed: function (confirm_text) {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/profile/send_delayed',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        caseopens_id: self.caseopens_id,
                        project: this.project
                    },
                    success: function (data) {
                        console.log(data);
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.delayed_id = data.id;
                            self.step = 2;
                            self.close();
                            window.profile.get_items();
                            ShowMsg(localization.success, localization.item_queued, 'success');
                        } else {
                            self.step = 2;
                            if (localization[data.error_message] != undefined) {
                                self.delayed_error = localization[data.error_message];
                            } else {
                                self.delayed_error = data.error_message;
                            }
                            self.delayed_active = false;
                        }
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                });
            },
        }
    });
}

function show_subscibe_modal() {
    if ($('.hell-pay-modal__new').length > 0) {
        ShowAddBalanceModal();
        return false;
    }
    pjax_fix('.subs_one_balance');
    window.subs_balance_app = new Vue({
        el: '.subs_one_balance',
        data: {
            renew: true,
            months: 1,
            price: 5,
            payment: 'g2a'
        },
        created: function () {
            ShowAddBalanceModal();
            $('.premium_subscribe').hide();
            $('.hell-pay-modal-premium').hide();
            $('.subs_one_balance').addClass('show');
        },
        methods: {
            back: function () {
                this.close();
                ShowAddBalanceModal();
            },
            close: function () {
                $('.subs_one_balance').removeClass('show');
                $('.premium_subscribe').show();
            },
            set_payment: function (payment) {
                this.payment = payment;
            },
            buy: function () {
                var self = this;
                if (this.payment == 'g2a') {
                    location.href = '/' + config.lang + '/premium/subscribe/1';
                    return false;
                }
                if (this.renew) var renew = 1;
                else var renew = 0;
                $.post('/' + config.lang + '/profile/set_self_subs', {
                    renew: renew
                }, function (result) {
                    if (result.status == 'success') {
                        ShowMsg(localization.success, 'Premium subscription purchased successfully!', 'success');
                        $('#pay').removeClass('with_premium');
                        $('.premium_subscribe').remove();
                        $('#subs_one_balance').remove();
                        $('#pay').hide();
                        hide_overlay();
                        try {
                            ga('newTracker.send', 'event', 'Funnel', 'premium_pop_purchase');
                        } catch (e) {
                            console.log('[GA] Error  ' + e.name + ":" + e.message);
                        }
                        self.close();
                    }
                });
            },
            set_month: function (month, price) {
                this.months = month;
                this.price = price;
            }
        }
    });
}

function payment_modal(need_sum, promocode) {
    pjax_fix('#payment_modal');
    need_sum = typeof (need_sum) != 'undefined' ? need_sum : config.pay.avg_sum;
    promocode = typeof (promocode) != 'undefined' ? promocode : '';
    if (need_sum < config.pay.avg_sum) {
        need_sum = config.pay.avg_sum;
    }
    const PAYMENT_G2A = 'g2a';
    const PAYMENT_COINPAYMENTS = 'coinpayments';
    const PAYMENT_SHADOWPAY = 'shadowpay';
    const PAYMENT_CENTER = 'center';
    window.payment_modal_app = new Vue({
        el: '#payment_modal',
        data: {
            payment: '',
            payment_list: [PAYMENT_G2A, PAYMENT_CENTER, PAYMENT_COINPAYMENTS, PAYMENT_SHADOWPAY],
            coinpayments: [],
            coinpayments_require_email: false,
            amount: need_sum,
            qr_lib: null,
            renew: false,
            bonus: 0,
            used_code: 0,
            min_refill_amount: 0,
            max_refill_amount: 0,
            percent: 0,
            percent_value: 0,
            promo_code: promocode,
            bonus_type: '',
            qr_code: '',
            type: 0,
            trade: '',
            timer: '',
            payment_settings: '',
            is_loading: false,
            months: 1,
            price: 5,
            subs_payment: 'g2a',
            coninpayments: [],
            coin_list_open: false,
            active_coin: {},
            block_pay_button: false,
            subscibe_form: false,
            payment_center_data: {
                amount: '',
                currency: '',
                description: '',
                email: '',
                extra: '',
                mac: '',
                orderId: '',
                serviceId: '',
                url: '',
            },
        },
        computed: {
            bonus_percent: function () {
                if (this.percent > 0 && this.amount > 0) {
                    return ((this.amount / 100) * this.percent).toFixed(2);
                }
            },
            bonus_sum: function () {
                if (this.percent > 0 && this.amount > 0) {
                    return (parseFloat(this.amount) + parseFloat(this.bonus_percent)).toFixed(2);
                }
            },
            is_active_pay_button: function () {
                if (this.is_loading) return false;
                if (this.amount == '') return false;
                if (this.amount < Number(this.min_refill_amount)) return false;
                if (this.amount > Number(this.max_refill_amount)) return false;
                if (this.payment == PAYMENT_COINPAYMENTS && this.coinpayments_require_email) return false;
                return true;
            },
        },
        created: function () {
            Vue.nextTick(function () {
                $('.hell-pay-modal-premium .premium_list h4').click(function () {
                    $('.hell-pay-modal-premium .premium_list h4 .angle').toggleClass('active');
                    $('.hell-pay-modal-premium .premium_list ul').toggle('slow');
                });
            });
            this.payment_settings = config.payment;
            this.avg_refill_amount = config.pay.avg_sum;
            this.min_refill_amount = config.pay.min_sum;
            this.max_refill_amount = config.pay.max_sum;
            if (this.payment_settings.g2a.active == 1) {
                this.payment = PAYMENT_G2A;
            }
            if (!this.payment) {
                for (var index in this.payment_settings) {
                    if (this.payment_settings[index].active == 1) {
                        this.payment = index;
                    }
                }
            }
            if (this.amount == 0) {
                this.amount = Number(this.avg_refill_amount);
            }
            if (this.payment === PAYMENT_G2A && this.amount < this.avg_refill_amount) {
                this.amount = Number(this.avg_refill_amount);
            }
            var self = this;
            this.check_pay_data();
            try {
                ga('newTracker.send', 'event', 'Funnel', 'Balance dialog');
            } catch (e) {
                console.log('[GA] Error  ' + e.name + ":" + e.message);
            }
            $('#payment_modal').show();
            $('body').addClass('is-modal');
            var c_path = location.pathname.split('/')[2];
            if (c_path == 'premium') {
                this.show_subscibe_modal();
            }
        },
        watch: {
            amount: function (val) {
                if (val === '') {
                    return;
                }
                var regexp = /^\d+$/;
                if (regexp.test(val) == false) {
                    this.amount = Number(this.min_refill_amount);
                    return;
                }
                if (val < this.min_refill_amount) {
                    ShowMsg(localization.error, localization.min_sum, 'error', 3000);
                    return;
                }
                if (val > this.max_refill_amount) {
                    this.amount = Number(this.max_refill_amount);
                }
            }
        },
        methods: {
            show_coin_list: function (is_hide) {
                if (!this.coin_list_open && !is_hide) {
                    this.coin_list_open = true;
                    $('.hell-pay-modal__coin-picker-items').show();
                    $('.fa fa-angle-up').show();
                    $('.fa fa-angle-down').hide();
                    $('.hell-pay-modal__coin').addClass('open');
                    return;
                }
                this.coin_list_open = false;
                $('.hell-pay-modal__coin-picker-items').hide();
                $('.fa fa-angle-up').hide();
                $('.fa fa-angle-down').show();
                $('.hell-pay-modal__coin').removeClass('open');
                return;
            },
            show_require_email: function () {
                var self = this;
                self.close();
                $.pjax({
                    url: '/' + config.lang + '/profile/' + user.id,
                    container: '#pjax-container'
                });
                $(document).one('pjax:end', function () {
                    show_add_email_modal();
                });
            },
            select_coin: function (coinpayment) {
                var self = this;
                this.coinpayments = this.coinpayments.map(function (elem) {
                    if (elem.short == coinpayment.short) {
                        self.active_coin = elem;
                        elem.is_selected = true;
                        return elem;
                    }
                    elem.is_selected = false;
                    return elem;
                });
            },
            get_crypto_rated_usd: function () {
                return (this.amount / this.active_coin.rate_usd).toFixed(9);
            },
            capitalizeFirstLetter: function (string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            },
            check_pay_data: function () {
                var self = this;
                if (typeof user !== undefined) {
                    $.post('/' + config.lang + '/profile/check_pay', {
                        wallet_promocode: user.wallet_promocode
                    }, function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.coinpayments = data.coinpayments.map(function (elem) {
                                if (elem.short === 'btc') {
                                    self.active_coin = elem;
                                    elem.is_selected = true;
                                    return elem;
                                }
                                elem.is_selected = false;
                                return elem;
                            });
                            if (typeof data.coinpayments_require_email !== 'undefined') {
                                self.coinpayments_require_email = data.coinpayments_require_email;
                            }
                            if (typeof data.promo !== 'undefined') {
                                self.percent = data.promo.percent | 0;
                                self.used_code = data.promo.name;
                                config.wallet_promocode_percent = data.promo.percent | 0;
                                if (data.promo.name == 'subscription') {
                                    self.bonus_type = localization.subscription_add_money;
                                } else {
                                    self.bonus_type = localization.promocode_add_money + ' <strong>' + data.promo.name + '</strong> ' + localization.promocode_add_money_;
                                }
                            }
                        }
                    }, 'json');
                }
            },
            show_subscibe_modal: function () {
                this.subscibe_form = true;
            },
            set_payment: function (payment) {
                if (this.payment_settings[payment].active == 0) {
                    return;
                }
                this.type = 0;
                if (this.payment === PAYMENT_G2A && Number(this.amount) < Number(this.min_refill_amount)) {
                    this.amount = Number(this.min_refill_amount);
                }
                this.payment = payment;
                this.qr_code = '';
                this.select_coin({
                    short: 'BTC'
                });
            },
            pay: function () {
                if (this.block_pay_button || !this.is_active_pay_button || this.is_loading) {
                    return;
                }
                this.block_pay_button = true;
                var self = this;
                if (this.payment === PAYMENT_G2A) {
                    try {
                        ga('newTracker.send', 'event', 'Funnel', 'Pay now');
                    } catch (e) {
                        console.log('[GA] Error  ' + e.name + ":" + e.message);
                    }
                    $('#payform').submit();
                    this.close();
                    return;
                }
                if (this.payment === PAYMENT_COINPAYMENTS) {
                    alert(localization.coinpayments_warning);
                    try {
                        ga('newTracker.send', 'event', 'Funnel', 'Pay now');
                    } catch (e) {
                        console.log('[GA] Error  ' + e.name + ":" + e.message);
                    }
                    $('#payform').submit();
                    this.close();
                    return;
                }
                if (this.payment === PAYMENT_SHADOWPAY) {
                    try {
                        ga('newTracker.send', 'event', 'Funnel', 'Pay now');
                    } catch (e) {
                        console.log('[GA] Error  ' + e.name + ":" + e.message);
                    }
                    $('#payformshadowpay').submit();
                    this.close();
                    return;
                }
                if (this.payment === PAYMENT_CENTER) {
                    $.ajax({
                        url: '/' + config.lang + '/pay',
                        type: 'POST',
                        data: {
                            sum: this.amount,
                            payment: this.payment,
                        },
                        success: function (data) {
                            if (data.status === 'success') {
                                self.payment_center_data = data.data;
                                Vue.nextTick(function () {
                                    $('#payformcenter').submit();
                                    this.close();
                                });
                                return;
                            }
                            ShowMsg(localization.error, 'Something goes wrong', 'error');
                        }
                    })
                }
            },
            back: function () {
                this.subscibe_form = false;
            },
            set_subs_payment: function (payment) {
                if (payment == 'g2a') {
                    this.renew = false;
                } else {
                    this.renew = true;
                }
                this.subs_payment = payment;
            },
            buy: function () {
                var self = this;
                if (this.subs_payment == 'g2a') {
                    location.href = '/' + config.lang + '/premium/subscribe/1';
                    return false;
                }
                if (this.renew) var renew = 1;
                else var renew = 0;
                $.post('/' + config.lang + '/profile/set_self_subs', {
                    renew: renew
                }, function (result) {
                    if (result.status == 'success') {
                        ShowMsg(localization.success, 'Premium subscription purchased successfully!', 'success');
                        $('#pay').removeClass('with_premium');
                        $('.premium_subscribe').remove();
                        $('#subs_one_balance').remove();
                        $('#pay').hide();
                        hide_overlay();
                        try {
                            ga('newTracker.send', 'event', 'Funnel', 'premium_pop_purchase');
                        } catch (e) {
                            console.log('[GA] Error  ' + e.name + ":" + e.message);
                        }
                        self.close();
                    }
                });
            },
            set_month: function (month, price) {
                this.months = month;
                this.price = price;
            },
            set_amount: function (amount) {
                if (this.payment !== '') {
                    this.amount = Number(amount);
                }
            },
            use_promo_code: function () {
                use_promocode(this.promo_code, function () {
                    window.payment_modal_app.check_pay_data();
                });
                this.check_pay_data();
                this.promo_code = '';
            },
            close: function () {
                clearInterval(this.timer);
                $('#payment_modal').hide();
                $('body').removeClass('is-modal');
                var c_path = location.pathname.split('/')[2];
                if (c_path == 'open') {
                    reload_page();
                }
            }
        }
    });
    $('#overlay').click(function () {
        clearInterval(window.payment_modal_app.timer);
        $('#payment_modal').hide();
        hide_overlay();
    });
}

function payment_cn_modal(need_sum, promocode) {
    need_sum = typeof (need_sum) != 'undefined' ? need_sum : config.pay.avg_sum;
    promocode = typeof (promocode) != 'undefined' ? promocode : '';
    if (need_sum < config.pay.avg_sum) {
        need_sum = config.pay.avg_sum;
    }
    const PAYMENT_G2A = 'g2a';
    const PAYMENT_ALI = 'alipay';
    const PAYMENT_WECHAT = 'wechat';
    const PAYMENT_UNION = 'unionpay';
    const PAYMENT_QQPAY = 'qqpay';
    show_overlay();
    pjax_fix('#payment_cn_modal');
    Vue.component('hell-amount', {
        props: ['amount'],
        template: '<li :class="{active: $parent.amount == amount}">' +
            '<a href="javascript:;" @click="$parent.set_amount(amount)">' +
            '<span><i class="hellicon-dollar"></i></span>' +
            '<strong><div class="bonus" v-if="amount >= $parent.min_refill_amount && (amount*($parent.percent / 100)).toFixed(0) > 0">+${{(amount*($parent.percent / 100)).toFixed(0)}}</div>{{amount}}</strong>' +
            '</a>' +
            '</li>'
    });
    window.payment_cn_modal_app = new Vue({
        el: '#payment_cn_modal',
        data: {
            payment: '',
            payment_list: [PAYMENT_ALI, PAYMENT_WECHAT, PAYMENT_G2A, PAYMENT_UNION, PAYMENT_QQPAY],
            amount: need_sum,
            qr_lib: null,
            renew: true,
            bonus: 0,
            used_code: 0,
            min_refill_amount: 0,
            min_refill_amount_cn: 0,
            max_refill_amount: 0,
            percent: 0,
            percent_value: 0,
            promo_code: promocode,
            bonus_type: '',
            qr_code: '',
            type: 0,
            trade: '',
            timer: '',
            payment_settings: '',
            is_loading: false,
            months: 1,
            price: 5,
            subs_payment: 'g2a'
        },
        beforeDestroy: function () {
            clearInterval(this.timer)
        },
        created: function () {
            this.payment_settings = config.payment_cn;
            this.min_refill_amount = config.pay.min_sum;
            this.min_refill_amount_cn = config.pay.min_sum_cn;
            this.max_refill_amount = config.pay.max_sum;
            if (this.payment_settings.alipay.active == 1) {
                this.payment = PAYMENT_ALI;
            }
            if (!this.payment) {
                for (var index in this.payment_settings) {
                    if (this.payment_settings[index].active == 1) {
                        this.payment = index;
                    }
                }
            }
            if (this.amount < this.min_refill_amount_cn) {
                this.amount = this.min_refill_amount_cn;
            }
            if (this.payment === PAYMENT_G2A && this.amount < this.min_refill_amount_cn) {
                this.amount = this.min_refill_amount;
            }
            this.check_pay_data();
            this.timer = setInterval(this.start_polling, 1000);
            try {
                ga('newTracker.send', 'event', 'Funnel', 'Balance dialog');
            } catch (e) {
                console.log('[GA] Error  ' + e.name + ":" + e.message);
            }
            $('#payment_cn_modal').show();
        },
        computed: {
            bonus_percent: function () {
                if (this.percent > 0 && this.amount > 0) {
                    return ((this.amount / 100) * this.percent).toFixed(2);
                }
            },
            bonus_sum: function () {
                if (this.percent > 0 && this.amount > 0) {
                    return (parseFloat(this.amount) + parseFloat(this.bonus_percent)).toFixed(2);
                }
            },
        },
        watch: {
            amount: function (val, oldV) {
                if (config.ENV === 'development') {
                    return;
                }
                if (this.payment === PAYMENT_G2A && Number(val) < Number(this.min_refill_amount)) {
                    ShowMsg(localization.error, localization.min_sum_cn + this.min_refill_amount, 'error', 3000);
                    this.amount = this.min_refill_amount;
                }
                if (this.payment !== PAYMENT_ALI && Number(val) < Number(this.min_refill_amount_cn)) {
                    ShowMsg(localization.error, localization.min_sum_cn + this.min_refill_amount_cn, 'error', 3000);
                    this.amount = this.min_refill_amount_cn;
                }
                if (val > this.max_refill_amount) {
                    this.amount = this.max_refill_amount;
                }
            }
        },
        methods: {
            check_pay_data: function () {
                var self = this;
                if (typeof user !== undefined) {
                    $.post("/" + config.lang + "/profile/check_pay_promo", {
                        wallet_promocode: user.wallet_promocode
                    }, function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.percent = data.percent | 0;
                            self.used_code = data.name;
                            config.wallet_promocode_percent = data.percent | 0;
                            if (data.name == 'subscription') {
                                self.bonus_type = localization.subscription_add_money;
                            } else {
                                self.bonus_type = localization.promocode_add_money + ' <strong>' + data.name + '</strong> ' + localization.promocode_add_money_;
                            }
                        }
                    }, 'json');
                }
            },
            capitalizeFirstLetter: function (string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            },
            show_subscibe_modal: function () {
                $('.premium_subscribe').hide();
                $('.hell-pay-modal-premium').hide();
                $('.subs_one_balance').addClass('show');
            },
            set_payment: function (payment) {
                if (this.payment_settings[payment].active == 0) {
                    return;
                }
                this.type = 0;
                if (this.payment === PAYMENT_G2A && Number(this.amount) < Number(this.min_refill_amount)) {
                    this.amount = Number(this.min_refill_amount);
                }
                if (this.payment !== PAYMENT_ALI && Number(this.amount) < Number(this.min_refill_amount_cn)) {
                    this.amount = Number(this.min_refill_amount_cn);
                }
                this.payment = payment;
                this.qr_code = '';
            },
            start_polling: function () {
                var self = this;
                if (this.trade) {
                    $.ajax({
                        url: '/' + config.lang + '/pay/check_pay_cn',
                        data: {
                            trade: self.trade
                        },
                        type: 'POST',
                        success: function (data) {
                            if (data.status === Hell.RESPONSE_STATUS_SUCCESS && data.trade == self.trade) {
                                updateBalance(data.balance);
                                ShowMsg(localization.success, 'Your balance refill was successful', 'success');
                                self.close();
                            }
                        }
                    });
                }
            },
            pay: function () {
                if (this.is_loading === true) {
                    return;
                }
                if (this.payment === PAYMENT_G2A) {
                    try {
                        ga('newTracker.send', 'event', 'Funnel', 'Pay now');
                    } catch (e) {
                        console.log('[GA] Error  ' + e.name + ":" + e.message);
                    }
                    $('#g2aform').submit();
                    return;
                }
                this.type = 0;
                this.is_loading = true;
                this.trade = '';
                var self = this;
                if (this.payment == PAYMENT_ALI || this.payment == PAYMENT_WECHAT || this.payment == PAYMENT_UNION || this.payment == PAYMENT_QQPAY) {
                    $.ajax({
                        url: '/' + config.lang + '/pay/pay_cn',
                        type: 'POST',
                        data: {
                            payment: this.payment,
                            total: this.amount,
                        },
                        success: function (data) {
                            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                                self.type = data.type;
                                if (self.type == 1) {
                                    if (self.qr_lib == null) {
                                        self.qr_lib = new QRCode(document.getElementById("qrcode"), {
                                            width: 170,
                                            height: 170
                                        });
                                    }
                                    self.qr_lib.makeCode(data.code);
                                }
                                self.qr_code = data.code;
                                self.is_loading = false;
                                self.trade = data.trade;
                                try {
                                    ga('newTracker.send', 'event', 'Funnel', 'Pay now');
                                } catch (e) {
                                    console.log('[GA] Error  ' + e.name + ":" + e.message);
                                }
                                return;
                            } else {
                                self.is_loading = false;
                                if (localization.hasOwnProperty(data.error_message)) {
                                    ShowMsg(STATUS_ERROR, localization[data.error_message], 'fail');
                                } else {
                                    ShowMsg(STATUS_ERROR, data.error_message, 'fail');
                                }
                            }
                        }
                    });
                }
            },
            back: function () {
                this.close();
                ShowAddBalanceModal();
            },
            close: function () {
                $('#subs_one_balance').removeClass('show');
                $('.premium_subscribe').show();
            },
            set_subs_payment: function (payment) {
                this.subs_payment = payment;
            },
            buy: function () {
                var self = this;
                if (this.subs_payment == 'g2a') {
                    location.href = '/' + config.lang + '/premium/subscribe/1';
                    return false;
                }
                if (this.renew) var renew = 1;
                else var renew = 0;
                $.post('/' + config.lang + '/profile/set_self_subs', {
                    renew: renew
                }, function (result) {
                    if (result.status == 'success') {
                        ShowMsg(localization.success, 'Premium subscription purchased successfully!', 'success');
                        $('#pay').removeClass('with_premium');
                        $('.premium_subscribe').remove();
                        $('#subs_one_balance').remove();
                        $('#pay').hide();
                        hide_overlay();
                        try {
                            ga('newTracker.send', 'event', 'Funnel', 'premium_pop_purchase');
                        } catch (e) {
                            console.log('[GA] Error  ' + e.name + ":" + e.message);
                        }
                        self.close();
                    }
                });
            },
            set_month: function (month, price) {
                this.months = month;
                this.price = price;
            },
            set_amount: function (amount) {
                if (this.payment !== '') {
                    this.amount = Number(amount);
                }
            },
            use_promo_code: function () {
                var self = this;
                use_promocode(this.promo_code, function () {
                    payment_cn_modal_app.check_pay_data();
                });
                this.promo_code = '';
            },
            close: function () {
                clearInterval(this.timer);
                $('#payment_cn_modal').hide();
                hide_overlay();
            }
        }
    });
    $('#overlay').click(function () {
        clearInterval(window.payment_cn_modal_app.timer);
        $('#payment_cn_modal').hide();
        hide_overlay();
    });
}

function load_profile() {
    if ($('#js-profile').length == 0) return false;
    pjax_fix('#js-profile');
    window.profile = new Vue({
        el: '#js-profile',
        data: {
            items: [],
            shards: [],
            events: [],
            config: {},
            item: {},
            is_loading: false,
            selected_items: [],
            lang: localization,
            is_owner: false,
            withdraw_agree_show: false,
            scam_confirm: false,
            tab: 'my-items',
            giveaway_history: [],
            provably_fair_current: {
                nonce: '',
                client_key: '',
                public_key: '',
            },
            provably_fair_checker: {
                roll: '',
                nonce: '',
                client_key: '',
                private_key: '',
                public_key: '',
                game_hash: '',
            }
        },
        created: function () {
            this.get_items_locale();
            var hash = window.location.hash.substr(1);
            if (hash == 'f') {
                this.tab = 'fairy';
            }
            if (['my-items', 'my-shards', 'casebattle', 'my-ga'].indexOf(hash) !== -1) {
                this.tab = hash;
            }
            if (items_data.provably_fair_checker !== null) {
                this.provably_fair_checker.nonce = items_data.provably_fair_checker.nonce;
                this.provably_fair_checker.public_key = items_data.provably_fair_checker.public_key;
                this.provably_fair_checker.client_key = items_data.provably_fair_checker.client_key;
                if (typeof items_data.provably_fair_checker.private_key !== 'undefined') {
                    this.provably_fair_checker.private_key = items_data.provably_fair_checker.private_key;
                }
                if (typeof items_data.provably_fair_checker.roll !== 'undefined') {
                    this.provably_fair_checker.roll = items_data.provably_fair_checker.roll;
                }
                if (typeof items_data.provably_fair_checker.game_hash !== 'undefined') {
                    this.provably_fair_checker.game_hash = items_data.provably_fair_checker.game_hash;
                }
            }
            if (items_data.provably_fair_current !== null) {
                Vue.set(this, 'provably_fair_current', items_data.provably_fair_current);
            }
            Vue.nextTick(function () {
                $('.fairy-body h2.mob').click(function (e) {
                    $(this).toggleClass('active');
                    $('.fairy-body ul').fadeToggle();
                });
                $('.fairy-play button').click(function (e) {
                    $('.fairy-play .fairy-info').fadeOut();
                    $(this).siblings('.fairy-info').fadeIn();
                });
                $(document).click(function (event) {
                    if ($(event.target).closest(".fairy-play").length) return;
                    $('.fairy-play .fairy-info').fadeOut();
                    event.stopPropagation();
                });
                if ($('.js-countdown').length > 0) {
                    $('.js-countdown').each(function (index) {
                        countdown_event($(this).data('datetime'), null, $(this).find('.event-tokens__timer-container'));
                    });
                }
                $('.js-open_trade_offer_access_url').click(function () {
                    return open_trade_offer_access_url();
                });
            });
        },
        computed: {
            total_sum: function () {
                var total = [];
                for (var i = 0, len = this.items.length; i < len; i++) {
                    if (this.items[i].steam_trade_offer_state != Hell.STEAM_TRADE_OFFER_STATE_NONE || this.items[i].state === 'active' || this.items[i].queued) {
                        continue;
                    }
                    total.push(this.items[i].win_price);
                }
                return total.reduce(function (total, num) {
                    return total + num
                }, 0).toFixed(2);
            },
            total_items: function () {
                var self = this;
                if (typeof (this.items.filter) !== 'function') return -1;
                var items = this.items.filter(function (item) {
                    return item.steam_trade_offer_state == Hell.STEAM_TRADE_OFFER_STATE_NONE
                });
                return items.length;
            },
            interactable_items: function () {
                return this.items.filter(a => a.steam_trade_offer_state == Hell.STEAM_TRADE_OFFER_STATE_NONE);
            },
            interactable_shards: function () {
                return this.shards.filter(a => (a.shard_part == a.shard_part_max) && !a.finished);
            },
            ending_events: function () {
                return this.events.filter(a => a.is_ending);
            },
        },
        methods: {
            get_items: function (cache) {
                var self = this;
                $.ajax({
                    url: "/" + config.lang + "/profile/get_items",
                    type: "get",
                    dataType: "json",
                    cache: cache,
                    success: function (data) {
                        self.items = data.items;
                        self.config = data.config;
                        self.shards = data.shards;
                    }
                });
            },
            combine: function (index) {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/profile/combine',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id: self.shards[index].id
                    },
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.shards.splice(index, 1);
                            self.tab = 'my-items';
                            data.item.new_added = true;
                            setTimeout(function () {
                                delete data.item.new_added;
                            }, 2000);
                            self.items.unshift(data.item);
                            ShowMsg(localization.success, localization.shard_combined, 'success', 10000);
                        } else {
                            ShowMsg(localization.error, localization[data.error_message], 'error', 10000);
                        }
                    },
                    error: function () {}
                });
            },
            hide_alert_scam: function () {
                this.withdraw_agree_show = false;
                hide_overlay();
            },
            accept_alert_scam: function () {
                if (this.scam_confirm == false) return false;
                this.withdraw_agree_show = false;
                Cookies.set('alert_scam', '1');
                hide_overlay();
                if (this.item) {
                    this.send_item(this.item);
                }
            },
            check_scam: function () {
                if (typeof (Cookies.get('alert_scam')) != 'undefined' && Cookies.get('alert_scam') == '1') return true;
                return false;
            },
            get_items_locale: function () {
                var self = this;
                if (typeof (window.items_data) === 'undefined') return false;
                self.items = window.items_data.items;
                self.events = window.items_data.events;
                self.shards = window.items_data.shards;
                self.config = window.items_data.config;
                self.is_owner = window.items_data.is_owner;
                self.giveaway_history = window.items_data.giveaway_history;
            },
            sell_all_items: function (cb, is_cashout) {
                var self = this;
                self.is_loading = true;
                if (is_cashout === undefined) {
                    is_cashout = false;
                }
                var selected_items = this.items;
                var selled_items = [];
                var total = [];
                var ids = [];
                for (var i = 0, len = selected_items.length; i < len; i++) {
                    if (this.items[i].steam_trade_offer_state != Hell.STEAM_TRADE_OFFER_STATE_NONE || this.items[i].state === 'active' || this.items[i].queued) {
                        continue;
                    }
                    total.push(this.items[i].win_price);
                    ids.push(this.items[i].caseopens_id);
                    selled_items.push(this.items[i]);
                }
                var total_sum = total.reduce(function (total, num) {
                    return total + num
                }, 0).toFixed(2);
                ids = ids.join(",");
                if (total_sum == 0) return false;
                $.ajax({
                    url: '/' + config.lang + '/profile/sell_mass',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        ids: ids,
                        is_cashout: is_cashout,
                        sum: total_sum
                    },
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            updateBalance(data.balance);
                            selled_items.forEach(function (x) {
                                if (is_cashout) {
                                    x.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_CASHOUT;
                                } else {
                                    x.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_SOLD;
                                }
                                x.is_active = true;
                                x.is_available = false;
                            });
                            if (typeof (cb) == 'function') {
                                cb(data.balance);
                            }
                            self.is_loading = false;
                            ShowMsg(localization.success, localization.items_sold.format(selled_items.length), Hell.RESPONSE_STATUS_SUCCESS, 3000);
                        } else {
                            ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                        }
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                })
            },
            cashout_all_items: function (confirm_text) {
                if (this.total_sum == 0) {
                    return false;
                }
                var self = this;
                if (confirm(confirm_text)) {
                    $.ajax({
                        url: '/' + config.lang + '/profile/items_cost',
                        type: 'POST',
                        success: function (data) {
                            self.sell_all_items(function (b) {
                                payout_items(data.cost);
                            }, true);
                        }
                    });
                }
            },
            contract_all_items: function () {
                var ids = [];
                for (var i = 0, len = this.items.length; i < len; i++) {
                    if (this.items[i].steam_trade_offer_state != Hell.STEAM_TRADE_OFFER_STATE_NONE) {
                        continue;
                    }
                    ids.push(this.items[i].caseopens_id);
                }
                if (ids.length == 0) return false;
                ids = ids.slice(0, 10).join(',');
                location.href = '/' + config.lang + '/contract#' + ids;
            },
            send_item_exchange: function (i) {
                var self = this;
                var item = self.items[i];
                var id = item.caseopens_id;
                var url = '/' + config.lang + '/profile/fake_exchange/' + id;
                $.ajax({
                    url: url,
                    type: 'POST',
                    dataType: 'json',
                    success: function (data) {
                        if (data.status == 'exchange') {
                            show_exchange_modal(id, data.weapon, data.weapons_list, function (d, type) {
                                if (type === 'close') {
                                    item.is_available = true;
                                    item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_NONE;
                                    return true;
                                }
                                if (d.status === Hell.RESPONSE_STATUS_SUCCESS) {
                                    item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_SOLD;
                                } else {
                                    item.is_available = true;
                                    item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_NONE;
                                }
                            }, data.available_methods);
                            return false;
                        }
                    },
                    error: function () {}
                });
            },
            show_scam_alert: function () {
                var self = this;
                show_overlay();
                this.withdraw_agree_show = true;
                $('#withdraw_agree .close, #overlay').one('click', function () {
                    self.hide_alert_scam();
                });
            },
            send_item: function (item) {
                var self = this;
                item.get_url = '#url_link';
                item.is_available = false;
                var id = item.caseopens_id;
                var url = '/' + config.lang + '/profile/send';
                if (this.check_scam() == false) {
                    this.item = item;
                    this.show_scam_alert();
                    return false;
                }
                $.ajax({
                    url: url,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id: id
                    },
                    success: function (data) {
                        if (data.status == 'exchange') {
                            show_exchange_modal(id, data.weapon, data.weapons_list, function (d, type) {
                                if (type === 'close') {
                                    item.is_available = true;
                                    item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_NONE;
                                    return true;
                                }
                                if (d.status === Hell.RESPONSE_STATUS_SUCCESS) {
                                    item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_SOLD;
                                } else {
                                    item.is_available = true;
                                    item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_NONE;
                                }
                            }, data.available_methods);
                            return false;
                        }
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            if (data.queued) {
                                item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_INVALID_OR_QUEUED;
                                ShowMsg(localization.success, localization[data.error_message], Hell.RESPONSE_STATUS_SUCCESS, 10000);
                                if (config.TRUSTPILOT_ACTIVE == 1) {
                                    if (self.hasClass('profit')) {
                                        setTimeout(function () {
                                            if (Cookies.get('trustpilot') == undefined) {
                                                show_trustpilot();
                                            }
                                        }, 1000);
                                    }
                                }
                            } else {
                                item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_ACTIVE;
                                var show_get_delay = false;
                                if (config.PROJECT == 'vgo') {
                                    item.get_url = 'https://trade.opskins.com/trade-offers/' + data.tradeofferid;
                                } else {
                                    if (data.tradeofferid == null || data.tradeofferid == "") {
                                        item.get_url = 'https://steamcommunity.com/id/me/tradeoffers/';
                                        show_get_delay = true;
                                    } else {
                                        item.get_url = 'https://steamcommunity.com/tradeoffer/' + data.tradeofferid;
                                    }
                                }
                                item.is_active = true;
                                ShowMsg(localization.success, localization.take_item, Hell.RESPONSE_STATUS_SUCCESS, 10000);
                            }
                        } else {
                            if (data.error_message === 'trade_ban') {
                                if (data.show_check_tradelink_modal) {
                                    show_overlay();
                                    $('#warning-tradelink').val($('.url_form input').val());
                                    $('.warning-popup').show();
                                    $("#overlay, .warning-popup .close").click(function () {
                                        $('.warning-popup').hide();
                                        hide_overlay();
                                    });
                                } else {
                                    ShowMsg(localization.error, localization.trade_ban, 'error', 10000);
                                }
                                return false;
                            }
                            if (data.error_message == 'no_op_account') {
                                show_overlay();
                                $('#withdraw_vgo_opskins').show();
                                $('#overlay, #withdraw_vgo_opskins .close').one('click', function () {
                                    $('#withdraw_vgo_opskins').hide();
                                    hide_overlay();
                                });
                                item.is_available = true;
                                item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_NONE;
                                return false;
                            }
                            if (typeof (data.should_refill) != 'undefined' && data.should_refill == true) {
                                ShowMsg(localization.error, localization[data.error_message].format(data.need_sum), 'error', 10000);
                                item.is_available = true;
                                item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_NONE;
                                return true;
                            }
                            if (data.type === 'steam' && typeof (data.error_message) === 'string') {
                                if (data.error_message.search('(15)') > 0) {
                                    ShowMsg(localization.error, localization.trade_error_15, 'error', 10000);
                                    item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_SOLD;
                                    return true;
                                }
                            }
                            show_notification_error(data.error_message);
                            item.is_available = true;
                            item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_NONE;
                        }
                    },
                    error: function () {}
                });
            },
            take_game: function (item) {
                var self = this;
                item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_ACCEPTED;
                item.is_available = false;
                show_game_code_modal(item.caseopens_id);
            },
            sell_item: function (item) {
                var self = this;
                item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_SOLD;
                item.is_active = true;
                item.is_available = false;
                var id = item.caseopens_id;
                var url = '/' + config.lang + '/profile/sell';
                $.ajax({
                    url: url,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id: id
                    },
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            updateBalance(data.balance);
                            ShowMsg(localization.success, localization.is_sold, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                        } else {
                            ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                        }
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                })
            },
            exchange: function (item) {},
            cancel_queue: function (i) {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/profile/cancel_queue',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        open_id: self.items[i].caseopens_id
                    },
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            Vue.set(self.items, i, data.item);
                            ShowMsg(localization.success, localization.delayed_canceled, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                        } else {
                            ShowMsg(localization.error, localization.wrong, 'error', 3000);
                        }
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                });
            },
            provably_check: function () {
                if (this.provably_fair_checker.roll === '' || this.provably_fair_checker.nonce === '' || this.provably_fair_checker.client_key === '' || this.provably_fair_checker.private_key === '' || this.provably_fair_checker.public_key === '' || this.provably_fair_checker.game_hash === '') {
                    return false;
                }
                alert('checked!');
            },
            fair_change_private_key: function () {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/profile/fair_change_private_key',
                    type: 'POST',
                    success: function (data) {
                        self.provably_fair_current.public_key = data.public_key;
                        self.provably_fair_current.nonce = data.nonce;
                        ShowMsg(localization.success, localization.fair_private_key_change, 'success', 2000);
                    }
                });
            },
            fair_change_client_seed: function () {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/profile/fair_change_client_seed',
                    data: {
                        key: self.provably_fair_current.client_key
                    },
                    type: 'POST',
                    success: function (data) {
                        ShowMsg(localization.success, localization.fair_client_seed_change, 'success', 2000);
                    }
                });
            },
        }
    });
    $('.btn-open-history, .user_block_money_history, .cashout-history__target').click(function () {
        show_history();
    });
}

function use_promocode(promo_code, success_callback) {
    if (promo_code) {
        $.post("/" + config.lang + "/profile/promocode", {
            code: promo_code
        }, function (data) {
            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                if (typeof data.casecode_buy_data !== 'undefined') {
                    ShowMsg(localization.success, localization.success_code, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                    location = "/" + config.lang + "/open/" + data.casecode_buy_data.case_name;
                    if (data.casecode_buy_data.case_category == 'farm') {
                        url = "/" + config.lang + "/farm/" + data.casecode_buy_data.case_name;
                        $('#pay,#payment_modal').hide();
                        updateBalance(data.balance);
                        setTimeout(function () {
                            farm_modal(data.casecode_buy_data.weapons, data.casecode_buy_data);
                        }, 2000);
                        $.pjax({
                            url: url,
                            container: '#pjax-container'
                        });
                        return;
                    }
                    if (data.casecode_buy_data.case_category == 'multicase') {
                        url = "/" + config.lang + "/multicase/" + data.casecode_buy_data.case_name;
                        location = "/" + config.lang + "/multicase/" + data.casecode_buy_data.case_name;
                        $('#pay,#payment_modal').hide();
                        updateBalance(data.balance);
                        $.pjax({
                            url: url,
                            container: '#pjax-container'
                        });
                        return;
                    }
                    return;
                }
                if (typeof (data.balance) != 'undefined') {
                    updateBalance(data.balance);
                }
                if (typeof (success_callback) == 'function') {
                    success_callback(data);
                }
                if (typeof (data.info) != 'undefined' && data.info.type == 'PROMOCODE' && data.info.info.type == 'PERCENTAGE') {
                    config.wallet_promocode_percent = data.info.info.amount;
                    $('.subtitle.forpromo').hide();
                    changePercentagePromoSum();
                    ShowMsg(localization.success, localization.success_code_percent, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                } else if (data.type == 'WALLETCODE') {
                    updateBalance(data.balance);
                    ShowMsg(localization.success, localization.success_code, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                    reload_page();
                } else if (typeof (data.info) != 'undefined' && data.info.type == 'PROMOCODE' && data.info.info.type == 'SUM') {
                    updateBalance(data.balance);
                    ShowMsg(localization.success, localization.success_code, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                    reload_page();
                } else if (data.type == 'WALLETCODE') {
                    updateBalance(data.balance);
                    ShowMsg(localization.success, localization.success_code, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                    reload_page();
                } else if (data.type == 'REFPROMOCODE') {
                    updateBalance(data.balance);
                    ShowMsg(localization.success, localization.success_code, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                    reload_page();
                } else if (typeof (data.info) != 'undefined' && data.info.type == 'PROMOCODE' && data.info.info.type == 'SUBSCRIPTION') {
                    ShowMsg(localization.success, localization.success_code_subs, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                    reload_page();
                } else {
                    ShowMsg(localization.success, localization.success_code, Hell.RESPONSE_STATUS_SUCCESS, 3000);
                    reload_page();
                }
            } else {
                switch (data.error_message) {
                    case 'need_auth':
                        ShowMsg(localization.error, localization.need_auth, 'error', 3000);
                        break;
                    case 'no_codes_left':
                        ShowMsg(localization.error, localization.no_codes_left, 'error', 3000);
                        break;
                    case 'wrong_code':
                        ShowMsg(localization.error, localization.wrong_code, 'error', 3000);
                        break;
                    case 'not_legal_user':
                        ShowMsg(localization.error, localization.banned, 'error', 3000);
                        break;
                    case 'used_code':
                        if (data.type == 'SUM') {}
                        if (data.type == 'PERCENTAGE') {}
                        if (data.type == 'SUBSCRIPTION') {}
                        if (data.type == 'REFPROMOCODE') {}
                        ShowMsg(localization.error, localization.used_walletcode, 'error', 3000);
                        break;
                    case 'free_need_level_or_game':
                        $('#pay.modal,#payment_modal').hide();
                        hide_overlay();
                        ShowMsg(localization.error, localization.free_need_level_or_game, 'fail show_need_level_or_game', 10000, function () {
                            $('#need_level_or_game').show();
                            show_overlay();
                            jsLazyload();
                            $('#need_level_or_game .close, #overlay').click(function () {
                                hide_overlay();
                                $('#need_level_or_game').hide();
                            });
                        });
                        break;
                    default:
                        if (typeof (data.error_message) != 'undefined') {
                            show_notification_error(data.error_message);
                        } else {
                            ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                        }
                }
            }
        }, 'json');
    } else {
        ShowMsg(localization.error, localization.wrong_code, 'error', 3000);
    }
}
payout_model.show.faq = function () {
    window.show_in_faq = new Vue({
        el: '#faq_page',
        data: {},
        methods: {
            show_spectrocoin: function () {
                payout_model.show.instructions('show_spectrocoin');
            },
            show_blockchain: function () {
                payout_model.show.instructions('show_blockchain');
            },
            show_coinbase: function () {
                payout_model.show.instructions('show_coinbase');
            },
            show_bitskins: function () {
                payout_model.show.instructions('show_bitskins');
            },
            show_waxpeer: function () {
                payout_model.show.instructions('show_waxpeer');
            },
            show_loobear: function () {
                payout_model.show.instructions('show_lootbear');
            },
            show_tradeit: function () {
                payout_model.show.instructions('show_tradeit');
            },
            show_skinfury: function () {
                payout_model.show.instructions('show_skinfury');
            },
        }
    });
}
payout_model.show.instructions = function (instruction) {
    pjax_fix('#cash-out-instruction-popup');
    window.payout_instruction = new Vue({
        el: '#cash-out-instruction-popup',
        data: {
            instruction_confirm: 0,
            required_confirm: true,
            need_back: false
        },
        created: function () {
            this.show_instruction();
            var self = this;
            Vue.nextTick(function () {
                $('#overlay, .instruction-modal .close').click(function () {
                    if ($('#cash_out_instruction:visible').length > 0) {
                        $('#cash-out-instruction-popup').hide();
                    } else {
                        $('#cash-out-instruction-popup').hide();
                        $('#payout').show();
                        self.back_to_main();
                        jsLazyload();
                    }
                });
                if (instruction != undefined) {
                    $('.back-title').parent().on('click', function () {
                        hide_overlay();
                        $('#cash-out-instruction-popup').hide();
                    });
                } else {
                    $('.back-title').on('click', function () {
                        self.back_to_main();
                    });
                }
            });
            if (instruction != undefined) {
                this[instruction]();
            }
        },
        methods: {
            show_payout: function () {
                $('#cash-out-instruction-popup').hide();
                setToStorage('disable_instruction', '1');
                show_payout(2);
            },
            show_instruction: function () {
                var self = this;
                this.instruction_confirm = 0;
                show_overlay();
                $('#cash-out-instruction-popup').show();
                jsLazyload();
                $('#overlay').click(function () {
                    self.back_to_main();
                });
            },
            show_spectrocoin: function () {
                $('#cash_out_instruction').hide();
                $('#spectrocoin_instruction').show();
                this.need_back = true;
                jsLazyload();
            },
            show_blockchain: function () {
                $('#cash_out_instruction').hide();
                $('#blockchain_instruction').show();
                this.need_back = true;
                jsLazyload();
            },
            show_coinbase: function () {
                $('#cash_out_instruction').hide();
                $('#coinbase_instruction').show();
                this.need_back = true;
                jsLazyload();
            },
            show_bitskins: function () {
                $('#cash_out_instruction').hide();
                $('#bitskins_instruction').show();
                this.need_back = true;
                jsLazyload();
            },
            show_waxpeer: function () {
                $('#cash_out_instruction').hide();
                $('#waxpeer_instruction').show();
                this.need_back = true;
                jsLazyload();
            },
            show_lootbear: function () {
                $('#cash_out_instruction').hide();
                $('#lootbear_instruction').show();
                this.need_back = true;
                jsLazyload();
            },
            show_tradeit: function () {
                $('#cash_out_instruction').hide();
                $('#tradeit_instruction').show();
                this.need_back = true;
                jsLazyload();
            },
            show_skinfury: function () {
                $('#cash_out_instruction').hide();
                $('#skinfury_instruction').show();
                this.need_back = true;
                jsLazyload();
            },
            back_to_main: function () {
                $('#tradeit_instruction, #lootbear_instruction, #waxpeer_instruction, #bitskins_instruction, #coinbase_instruction, #blockchain_instruction, #spectrocoin_instruction, #skinfury_instruction').hide();
                $('#cash_out_instruction').show();
                jsLazyload();
            }
        }
    });
}
payout_model.show.check_email = function () {
    window.check_email_modal = new Vue({
        el: '#check_email_modal',
        data: {},
        created: function () {
            show_overlay();
            $('#check_email_modal').show();
            Vue.nextTick(function () {
                $('#check_email_modal .close, #check_email_modal a.hellcase-btn-info').click(function () {
                    hide_overlay();
                    $('#check_email_modal').hide();
                });
            });
        }
    });
}
const CONVAS_SIZE = 480;
const WEAPON_SIZE = 65;
Math.radians = function (degrees) {
    return degrees * Math.PI / 180;
};
Math.degrees = function (radians) {
    return radians * 180 / Math.PI;
};

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function _log() {
    if (config.ENV == "development") {
        console.log(arguments);
    }
}
class Game {
    constructor(weapons, users, setup_ready) {
        this.app = new PIXI.Application({
            width: CONVAS_SIZE,
            height: CONVAS_SIZE,
            antialias: true,
            transparent: true,
            forceCanvas: true,
            resolution: 2
        });
        this.weapons_container = new PIXI.Container();
        this.cells_container = new PIXI.Container();
        this.timer_container = new PIXI.Container();
        this.waiting_container = new PIXI.Container();
        this.winner_container = new PIXI.Container();
        this.users_container = new PIXI.Container();
        this.user_list_container = new PIXI.Container();
        this.user_list_mask = new PIXI.Container();
        this.weapons = weapons;
        this.cells = [];
        this.wheel = null;
        this.stat_bg = {};
        this.users = [];
        this.users_list = users;
        this.winner_cell = 0;
        this.weapon = {};
        this.win_user_id = 0;
        this.times_countdown = 0;
        this.started = false;
        this.is_finished = false;
        this.is_loading = false;
        this.setup_ready = setup_ready;
        this.callback_start_game = function () {};
        this.callback_end_game = function () {};
        this.countdownid = null;
        this.countdown_date = null;
        this.spin_type = 'weapons';
        this.user_win_offset_index = 0;
        this.offset_user_winner = 0;
        this.weapon_image_user = null;
        this.roll_cell_array = [];
        this.rectangle_timer_test = null;
        let self = this;
        let images = [];
        this.is_loading = true;
        weapons.forEach(function (w) {
            if (images.indexOf(w.id) == -1) {
                images.push(w.id);
            }
        });
        images.forEach(function (i) {
            if (PIXI.Loader.shared.resources['/en/wheel/fetch/' + i + '/image.png'] === undefined) {
                PIXI.Loader.shared.add({
                    url: '/en/wheel/fetch/' + i + '/image.png',
                    crossOrigin: '*'
                });
            }
        });
        this.users_list.forEach(function (u) {
            if (PIXI.Loader.shared.resources[u.steam_avatarfull] === undefined) {
                PIXI.Loader.shared.add({
                    url: u.steam_avatarfull,
                    crossOrigin: '*'
                });
            }
        });
        PIXI.Loader.shared.load(function () {
            self.is_loading = false;
            self.setup();
        });
    }
    build(weapons) {
        let i = 0;
        this.color_brightness = new PIXI.filters.ColorMatrixFilter();
        this.color_brightness.brightness(0.7);
        this.weapons_container.pivot.set(CONVAS_SIZE / 2 - 15, CONVAS_SIZE / 2 - 15);
        this.weapons_container.x = CONVAS_SIZE / 2;
        this.weapons_container.y = CONVAS_SIZE / 2;
        this.cells_container.x = CONVAS_SIZE / 2;
        this.cells_container.y = CONVAS_SIZE / 2;
        this.cells_container.pivot.set(CONVAS_SIZE / 2, CONVAS_SIZE / 2);
        this.times_countdown = 0;
        let self = this;
        this.is_loading = true;
        const min_players_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 16,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: '#FFFFFF',
            wordWrap: true,
            wordWrapWidth: 440,
        });
        let price_text = null;
        self.weapons_container.children = [];
        self.cells_container.children = [];
        weapons.forEach(function (w) {
            self.weapons[i] = new PIXI.Sprite(PIXI.Loader.shared.resources['/en/wheel/fetch/' + w.id + '/image.png'].texture);
            self.weapons[i].x = ((CONVAS_SIZE - WEAPON_SIZE / 2) / 2);
            self.weapons[i].y = ((CONVAS_SIZE - WEAPON_SIZE / 2) / 2);
            self.weapons[i].rotation = Math.radians((i * 25.7) + 8);
            self.weapons[i].width = WEAPON_SIZE;
            self.weapons[i].height = WEAPON_SIZE;
            self.weapons[i].pivot.set(0, -900);
            self.weapons[i].id = w.id;
            self.weapons[i].weapon = w;
            self.weapons_container.addChild(self.weapons[i]);
            self.cells[i] = new PIXI.Sprite(PIXI.Loader.shared.resources["/img/wheel/rarity/" + w.rarity + ".png"].texture);
            self.cells[i].x = CONVAS_SIZE - 236 - 4;
            self.cells[i].y = CONVAS_SIZE - 236 - 4;
            self.cells[i].alpha = 1;
            self.cells[i].width = 226;
            self.cells[i].height = 236;
            self.cells[i].rotation = Math.radians((i * 25.7));
            self.cells[i].pivot.set((588 / 2), 1);
            self.cells_container.addChild(self.cells[i]);
            price_text = new PIXI.Text('$' + w.steam_price_en, min_players_style);
            price_text.x = Math.round((CONVAS_SIZE - price_text.width) / 2);
            price_text.y = Math.round((CONVAS_SIZE - price_text.height) / 2);
            price_text.rotation = Math.radians(i * 25.7);
            self.weapons_container.addChild(price_text);
            i++;
        });
    }
    start_game(weapon, user_id) {
        let self = this;
        this.weapon = weapon;
        this.win_user_id = user_id;
        this.winner_cell = this.get_winner_cell();
        let weapons_spin_time = 7 * 60;
        let cell_id = 0;
        let shortener = 3;
        let separator = Math.floor(weapons_spin_time / shortener) % 14;
        for (let index = 0; index < weapons_spin_time; index++) {
            if (index % shortener == 0) {
                let i = 13 - cell_id;
                this.roll_cell_array.push((separator + i + this.winner_cell + 1) % 14);
                if (cell_id == 13) {
                    cell_id = 0;
                } else {
                    cell_id++;
                }
            }
        }
        this.timer_container.visible = false;
        this.waiting_container.visible = false;
        this.winner_container.visible = false;
        this.user_list_container.visible = false;
        this.users_container.visible = false;
        this.stat_bg.visible = true;
        this.spin_type = 'weapons';
        this.times_countdown = weapons_spin_time;
        this.started = true;
        this.set_highlight_items_cell();
        this.callback_start_game();
    }
    start_users_roll() {
        this.stat_bg.visible = false;
        this.spin_type = 'users';
        this.user_list_container.y = 0;
        this.times_countdown = 5 * 60;
        this.started = true;
        this.user_list_mask.visible = true;
        this.find_win_user_offset();
        this.show_userlist_spin();
    }
    get_winner_cell() {
        var cell_index = 0;
        for (let index = 0; index < 14; index++) {
            if (this.weapons[index].id == this.weapon.id) cell_index = index;
        }
        return cell_index;
    }
    set_win_item() {
        this.set_user_list();
    }
    set_highlight_items_cell() {
        for (let index = 0; index < 14; index++) {
            if (typeof (this.cells[index]) != 'undefined') {
                this.cells[index].filters = [this.color_brightness];
            }
        }
    }
    set_coin_icon(image) {
        this.icon = image;
    }
    gameLoop(delta) {
        let spin_time = 0.001;
        let self = this;
        if (this.spin_type == 'weapons') {
            if (this.times_countdown > 0) {
                this.times_countdown -= 1;
                spin_time = this.times_countdown * 0.00025;
                this.weapons_container.rotation += spin_time;
                this.cells_container.rotation += spin_time;
                this.animate_circle_cell();
            }
            if (this.times_countdown <= 0 && this.started) {
                this.started = false;
                this.set_win_item();
                setTimeout(function () {
                    self.start_users_roll();
                }, 2000);
            }
        }
        if (this.spin_type == 'users') {
            if (this.times_countdown > 0) {
                this.times_countdown -= 1;
                this.user_list_container.y -= delta * self.users.length;
                if (this.user_list_container.y < this.offset_user_winner) {
                    this.times_countdown = 0;
                    this.started = true;
                    this.user_list_container.y = this.offset_user_winner;
                }
            }
            if (this.times_countdown <= 0 && this.started) {
                this.started = false;
                setTimeout(function () {
                    self.user_list_mask.visible = false;
                    self.callback_end_game();
                    self.timer_container.visible = false;
                    self.waiting_container.visible = false;
                    self.winner_container.visible = false;
                    self.user_list_container.visible = false;
                    self.users_container.visible = false;
                    self.stat_bg.visible = true;
                    _log('END');
                }, 2000);
            }
        }
    }
    set_elements() {
        let SIZE = 275;
        var self = this;
        this.wheel = new PIXI.Sprite(PIXI.Loader.shared.resources["/img/wheel/wheel.png"].texture);
        this.wheel.x = CONVAS_SIZE / 2 - (SIZE / 2);
        this.wheel.y = CONVAS_SIZE / 2 - (SIZE / 2);
        this.wheel.width = SIZE;
        this.wheel.height = SIZE;
        this.app.stage.addChild(this.wheel);
        this.stat_bg = new PIXI.Sprite(PIXI.Loader.shared.resources["/img/wheel/center_stat.png"].texture);
        this.stat_bg.x = CONVAS_SIZE / 2 - (SIZE / 2);
        this.stat_bg.y = CONVAS_SIZE / 2 - (SIZE / 2);
        this.stat_bg.width = SIZE;
        this.stat_bg.height = SIZE;
        this.app.stage.addChild(this.stat_bg);
        this.rectangle_timer_test = new PIXI.Graphics();
        this.rectangle_timer_test.lineStyle(0, 0xFFFFFF, 1);
        this.rectangle_timer_test.beginFill(0xFFFFFF);
        this.rectangle_timer_test.drawRect(0, 0, 200, 60);
        this.rectangle_timer_test.endFill();
        this.rectangle_timer_test.x = 140;
        this.rectangle_timer_test.alpha = 0.03;
        this.rectangle_timer_test.y = 215;
        this.timer_container.addChild(this.rectangle_timer_test);
        const waiting_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 22,
            fontStyle: 'normal',
            fontWeight: 'bold',
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: 440,
        });
        this.waiting_start = new PIXI.Text('WAITING TO START', waiting_style);
        this.waiting_start.x = Math.round((CONVAS_SIZE - this.waiting_start.width) / 2);
        this.waiting_start.y = Math.round((CONVAS_SIZE - this.waiting_start.height) / 2);
        this.waiting_container.addChild(this.waiting_start);
        const min_players_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 16,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: '#BBBCBE',
            wordWrap: true,
            wordWrapWidth: 440,
        });
        this.min_players = new PIXI.Text('Min ' + wheel.total_players + '/' + WHEEL_DATA.settings.MIN_PLAYERS + ' players', min_players_style);
        this.min_players.x = Math.round((CONVAS_SIZE - this.min_players.width) / 2);
        this.min_players.y = Math.round((CONVAS_SIZE + this.min_players.height * 2) / 2);
        this.waiting_container.addChild(this.min_players);
        const small_gray_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 14,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: '#697582',
        });
        this.game_text = new PIXI.Text('Game', small_gray_style);
        this.game_text.x = Math.round((CONVAS_SIZE - this.game_text.width) / 2);
        this.game_text.y = Math.round((CONVAS_SIZE - this.game_text.height - 150) / 2);
        this.timer_container.addChild(this.game_text);
        this.time_spin_text = new PIXI.Text('Time to spin', small_gray_style);
        this.time_spin_text.x = Math.round((CONVAS_SIZE - this.time_spin_text.width) / 2);
        this.time_spin_text.y = Math.round((CONVAS_SIZE - this.time_spin_text.height / 2 - 30) / 2);
        this.timer_container.addChild(this.time_spin_text);
        this.total_tokens_text = new PIXI.Text('Total tokens', small_gray_style);
        this.total_tokens_text.x = Math.round((CONVAS_SIZE - this.total_tokens_text.width) / 2);
        this.total_tokens_text.y = Math.round((CONVAS_SIZE + this.total_tokens_text.height + 100) / 2);
        this.timer_container.addChild(this.total_tokens_text);
        const game_counter_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 20,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: '#ffffff',
        });
        this.game_counter = new PIXI.Text('#0000', game_counter_style);
        this.game_counter.x = Math.round((CONVAS_SIZE - this.game_counter.width) / 2);
        this.game_counter.y = Math.round((CONVAS_SIZE - this.game_counter.height - 100) / 2);
        this.timer_container.addChild(this.game_counter);
        this.token_counter_text = new PIXI.Text('0', game_counter_style);
        this.token_counter_text.x = Math.round(((CONVAS_SIZE - self.token_counter_text.width) / 2) + 10);
        this.token_counter_text.y = Math.round((CONVAS_SIZE + this.token_counter_text.height + 130) / 2);
        this.timer_container.addChild(this.token_counter_text);
        const timer_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 25,
            fontStyle: 'normal',
            fontWeight: 'bold',
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: 440,
        });
        this.timer_text = new PIXI.Text('00:00', timer_style);
        this.timer_text.x = Math.round((CONVAS_SIZE - this.timer_text.width) / 2);
        this.timer_text.y = Math.round((CONVAS_SIZE - this.timer_text.height / 2 + 20) / 2);
        this.timer_container.addChild(this.timer_text);
        this.win_item = new PIXI.Sprite(PIXI.Loader.shared.resources['/img/wheel/wheel.png'].texture);
        this.win_item.x = (CONVAS_SIZE - 120) / 2;
        this.win_item.y = (CONVAS_SIZE - 120) / 2;
        this.win_item.alpha = 1;
        this.win_item.width = 120;
        this.win_item.height = 120;
        this.token_icon = new PIXI.Sprite(PIXI.Loader.shared.resources[WHEEL_DATA.icon].texture);
        this.token_icon.x = 210;
        this.token_icon.y = 310;
        this.token_icon.width = 35;
        this.token_icon.height = 35;
        this.timer_container.addChild(this.token_icon);
        const win_item_name_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 16,
            fontStyle: 'normal',
            fontWeight: 'bold',
            fill: '#ffffff',
        });
        const win_item_sub_name_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 12,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: '#ffffff',
        });
        const exterior_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 12,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: '#808080',
        });
        const st_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 12,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: '#EA6A2A',
        });
        this.win_item_name_text = new PIXI.Text('', win_item_name_style);
        this.win_item_name_text.x = Math.round(((CONVAS_SIZE - this.win_item_name_text.width) / 2));
        this.win_item_name_text.y = Math.round((CONVAS_SIZE + this.win_item_name_text.height + 60) / 2);
        this.win_item_sub_name_text = new PIXI.Text('', win_item_sub_name_style);
        this.win_item_sub_name_text.x = Math.round(((CONVAS_SIZE - this.win_item_sub_name_text.width) / 2));
        this.win_item_sub_name_text.y = Math.round((CONVAS_SIZE + this.win_item_sub_name_text.height + 110) / 2);
        this.exterior_text = new PIXI.Text('FT', exterior_style);
        this.exterior_text.x = Math.round(CONVAS_SIZE / 2) - this.exterior_text.width;
        this.exterior_text.y = Math.round(CONVAS_SIZE / 2) - 60;
        this.st_text = new PIXI.Text('ST', st_style);
        this.st_text.x = Math.round(CONVAS_SIZE / 2) + this.st_text.width;
        this.st_text.y = Math.round(CONVAS_SIZE / 2) - 60;
        this.st_text.visible = true;
        this.price_text = new PIXI.Text('$0.00', win_item_sub_name_style);
        this.price_text.x = Math.round(CONVAS_SIZE / 2 - this.price_text.width / 2);
        this.price_text.y = Math.round(CONVAS_SIZE / 2) + 85;
        this.price_text.visible = true;
        this.winner_container.addChild(this.price_text);
        this.winner_container.addChild(this.st_text);
        this.winner_container.addChild(this.exterior_text);
        this.winner_container.addChild(this.win_item_name_text);
        this.winner_container.addChild(this.win_item);
        this.winner_container.addChild(this.win_item_sub_name_text);
        this.winner_container.visible = false;
        this.waiting_container.visible = false;
        this.timer_container.visible = false;
        this.app.stage.addChild(this.timer_container);
        this.app.stage.addChild(this.waiting_container);
        this.app.stage.addChild(this.winner_container);
    }
    set_user_list() {
        let avatar_size = 30;
        let self = this;
        const user_name_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 12,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: '#FFFFFF',
        });
        let index_offset = 0;
        self.user_list_container.children = [];
        self.users_container.children = [];
        for (let index = 0; index < 10; index++) {
            self.users_list.forEach(function (u) {
                let circle = new PIXI.Graphics();
                circle.beginFill(0xFFFFFF);
                circle.drawCircle(avatar_size / 2, avatar_size / 2, avatar_size / 2);
                circle.endFill();
                circle.x = 0;
                circle.y = (index_offset * 45) + 15;
                self.user_list_container.addChild(circle);
                self.users[index_offset] = {};
                self.users[index_offset].avatar = new PIXI.Sprite(PIXI.loader.resources[u.steam_avatarfull].texture);
                self.users[index_offset].avatar.x = 0;
                self.users[index_offset].avatar.y = (index_offset * 45) + 15;
                self.users[index_offset].avatar.alpha = 1;
                self.users[index_offset].avatar.width = avatar_size;
                self.users[index_offset].avatar.height = avatar_size;
                self.users[index_offset].avatar.mask = circle;
                if (u.steam_personaname.length > 10) u.steam_personaname = u.steam_personaname.substr(0, 10) + '...';
                self.users[index_offset].name = new PIXI.Text(u.steam_personaname, user_name_style);
                self.users[index_offset].name.x = avatar_size + 10;
                self.users[index_offset].name.y = (index_offset * 45) + 20;
                self.users[index_offset].name.user_id = u.user_id;
                self.user_list_container.addChild(self.users[index_offset].name);
                self.user_list_container.addChild(self.users[index_offset].avatar);
                index_offset++;
            });
        }
        let user_bg = new PIXI.Sprite(PIXI.loader.resources["/img/wheel/users_bg.png"].texture);
        user_bg.x = CONVAS_SIZE / 2 - (275 / 2);
        user_bg.y = CONVAS_SIZE / 2 - (275 / 2);
        user_bg.width = 275;
        user_bg.height = 275;
        this.users_container.addChild(user_bg);
        let weapon_container = this.set_weapon_item(this.weapon.id, this.weapon.parsed_name.name, this.weapon.parsed_name.type, this.weapon.parsed_name.short_exterior, this.weapon.steam_price_en, this.weapon.steam_is_stattrak);
        weapon_container.y = -20;
        weapon_container.x = 60;
        this.users_container.addChild(weapon_container);
        let mask_big_circle1 = new PIXI.Graphics();
        mask_big_circle1.beginFill(0x000000);
        mask_big_circle1.drawCircle(100, 135, 135);
        mask_big_circle1.endFill();
        mask_big_circle1.x = 140;
        mask_big_circle1.y = 105;
        this.user_list_container.mask = mask_big_circle1;
        this.users_container.mask = mask_big_circle1;
        this.user_list_container.x = 120;
        this.user_list_container.y = 120;
        let rectangle = new PIXI.Graphics();
        rectangle.lineStyle(0, 0xFF3300, 1);
        rectangle.beginFill(0x9570FF);
        rectangle.drawRect(0, 0, 150, avatar_size + 10);
        rectangle.endFill();
        rectangle.x = 90;
        rectangle.alpha = 0.2;
        rectangle.y = 44 * 5;
        let g1 = new PIXI.Graphics();
        g1.beginFill(0x1C2127);
        g1.drawRect(0, 0, 150, 220);
        g1.endFill();
        g1.x = 88;
        g1.alpha = 0.9;
        g1.y = 0;
        let g2 = new PIXI.Graphics();
        g2.beginFill(0x1C2127);
        g2.drawRect(0, 0, 150, 220);
        g2.endFill();
        g2.x = 88;
        g2.alpha = 0.9;
        g2.y = 260;
        g1.mask = mask_big_circle1;
        g2.mask = mask_big_circle1;
        this.user_list_mask.children = [];
        this.user_list_mask.visible = false;
        this.user_list_mask.addChild(g1);
        this.user_list_mask.addChild(g2);
        this.users_container.addChild(rectangle);
        this.users_container.addChild(mask_big_circle1);
        this.user_list_container.visible = false;
        this.users_container.visible = false;
        this.app.stage.addChild(this.users_container);
        this.app.stage.addChild(this.user_list_container);
        this.app.stage.addChild(this.user_list_mask);
    }
    set_weapon_item(weapon_id, name, subname, exterior, price, is_stattrack) {
        const exterior_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 12,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: '#808080',
        });
        const st_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 12,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: '#EA6A2A',
        });
        const win_item_name_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 16,
            fontStyle: 'normal',
            fontWeight: 'bold',
            fill: '#ffffff',
        });
        const win_item_sub_name_style = new PIXI.TextStyle({
            fontFamily: 'Open Sans',
            fontSize: 12,
            fontStyle: 'normal',
            fontWeight: 'normal',
            fill: '#ffffff',
        });
        let exterior_text = new PIXI.Text(exterior, exterior_style);
        exterior_text.x = Math.round(CONVAS_SIZE / 2) - exterior_text.width;
        exterior_text.y = Math.round(CONVAS_SIZE / 2) - 50;
        let st_text = new PIXI.Text('ST', st_style);
        st_text.x = Math.round(CONVAS_SIZE / 2) + st_text.width;
        st_text.y = Math.round(CONVAS_SIZE / 2) - 50;
        if (is_stattrack == "1") {
            st_text.visible = true;
        } else {
            st_text.visible = false;
        }
        let price_text = new PIXI.Text('$' + price, win_item_sub_name_style);
        price_text.x = Math.round(CONVAS_SIZE / 2 - price_text.width / 2);
        price_text.y = Math.round(CONVAS_SIZE / 2) + 90;
        price_text.visible = true;
        let weapon_container = new PIXI.Container();
        let win_item = null;
        for (let w of this.weapons) {
            if (w.id == weapon_id) {
                win_item = new PIXI.Sprite(w.texture);
            }
        }
        if (win_item == null) {
            _log('invalid item weapon_id');
            return false;
        }
        win_item.x = (CONVAS_SIZE - 120) / 2;
        win_item.y = (CONVAS_SIZE - 120) / 2;
        win_item.alpha = 1;
        win_item.width = 120;
        win_item.height = 120;
        let win_item_name_text = new PIXI.Text(name, win_item_name_style);
        win_item_name_text.x = Math.round(((CONVAS_SIZE - win_item_name_text.width) / 2));
        win_item_name_text.y = Math.round((CONVAS_SIZE + win_item_name_text.height + 80) / 2);
        let win_item_sub_name_text = new PIXI.Text(subname, win_item_sub_name_style);
        win_item_sub_name_text.x = Math.round(((CONVAS_SIZE - win_item_sub_name_text.width) / 2));
        win_item_sub_name_text.y = Math.round((CONVAS_SIZE + win_item_sub_name_text.height + 125) / 2);
        weapon_container.addChild(win_item_name_text);
        weapon_container.addChild(win_item);
        weapon_container.addChild(win_item_sub_name_text);
        weapon_container.addChild(exterior_text);
        weapon_container.addChild(price_text);
        weapon_container.addChild(st_text);
        return weapon_container;
    }
    find_win_user_offset() {
        for (let index = 0; index < this.users.length; index++) {
            if (parseInt(this.users[index].name.user_id) == parseInt(this.win_user_id)) {
                this.user_win_offset_index = index;
            }
        }
        this.offset_user_winner = (105 + ((this.user_win_offset_index - this.users_list.length - 7) * 45)) * -1;
        _log('find_win_user_offset', this.offset_user_winner);
    }
    show_userlist_spin() {
        this.user_list_container.y = 120;
        this.user_list_container.visible = true;
        this.users_container.visible = true;
        this.waiting_container.visible = false;
        this.winner_container.visible = false;
    }
    animate_circle_cell() {
        if (this.times_countdown % 3 != 1) return false;
        var i = this.roll_cell_array.shift();
        this.cells[i].filters = [this.color_brightness];
        if (i > 0) {
            i--;
            this.cells[i].filters = [];
        } else {
            this.cells[13].filters = [];
        }
        if (this.started) {
            this.win_item_name_text.text = this.weapons[i].weapon.parsed_name.name;
            this.win_item_sub_name_text.text = this.weapons[i].weapon.parsed_name.type;
            this.exterior_text.text = this.weapons[i].weapon.parsed_name.short_exterior;
            this.price_text.text = '$' + this.weapons[i].weapon.steam_price_en;
            this.st_text.visible = (this.weapons[i].weapon.steam_is_stattrak == "1");
            this.win_item_name_text.x = Math.round((CONVAS_SIZE - this.win_item_name_text.width) / 2);
            this.win_item_sub_name_text.x = Math.round((CONVAS_SIZE - this.win_item_sub_name_text.width) / 2);
            this.win_item.texture = this.weapons[i].texture;
            this.winner_container.visible = true;
            this.stat_bg.visible = true;
        }
    }
    toggle_waiting(show) {
        if (show) {
            this.waiting_container.visible = true;
        } else {
            this.waiting_container.visible = false;
        }
    }
    set_total_tokens(tokens) {
        this.token_counter_text.text = tokens;
        this.token_counter_text.x = Math.round(((CONVAS_SIZE - this.token_counter_text.width) / 2) + 10);
    }
    toggle_game_timer(datetime) {
        var self = this;
        this.timer_container.visible = true;
        this.countdown_date = datetime;
        if (this.timer_container.visible) {
            this.countdownid = setInterval(function () {
                var timeago = self.countdown_date - hget_time();
                if (timeago > 0) {
                    self.timer_text.text = format_time(timeago);
                } else {
                    self.timer_text.text = 'READY TO START';
                }
                self.timer_text.x = Math.round((CONVAS_SIZE - self.timer_text.width) / 2);
            }, 1000);
        }
    }
    set_win_item_props(weapon_id, name, sub_name) {
        var self = this;
        this.win_item_name_text.text = name;
        this.win_item_sub_name_text.text = sub_name;
        this.win_item_name_text.x = Math.round((CONVAS_SIZE - this.win_item_name_text.width) / 2);
        this.win_item_sub_name_text.x = Math.round((CONVAS_SIZE - this.win_item_sub_name_text.width) / 2);
        this.weapons.forEach(function (w) {
            if (w.id == weapon_id) {
                self.win_item.texture = w.texture;
            }
        });
        this.winner_container.visible = true;
        this.stat_bg.visible = true;
    }
    set_game_number(num) {
        this.game_counter.text = num;
        this.game_counter.x = Math.round((CONVAS_SIZE - this.game_counter.width) / 2);
    }
    set_main_bg() {
        const bg_circle = new PIXI.Graphics();
        bg_circle.lineStyle(0);
        bg_circle.beginFill(0x232A30, 1);
        bg_circle.drawCircle(CONVAS_SIZE / 2, CONVAS_SIZE / 2, CONVAS_SIZE / 2);
        bg_circle.endFill();
        this.app.stage.addChild(bg_circle);
    }
    set_weapons() {
        this.app.stage.addChild(this.cells_container);
        this.app.stage.addChild(this.weapons_container);
    }
    reset() {}
    setup() {
        this.reset();
        this.build(this.weapons);
        this.set_main_bg();
        this.set_weapons();
        this.set_elements();
        this.is_loading = false;
        this.app.ticker.add(delta => this.gameLoop(delta));
        if (typeof (this.setup_ready) == 'function') {
            this.setup_ready();
        }
    }
}

function wheel_initialize() {
    pjax_fix('#wheel');
    window.game_pixi = null;
    window.wheel = new Vue({
        el: '#wheel',
        data: {
            view: 'index',
            is_started: false,
            is_over: false,
            is_loading: false,
            user: user,
            path: '/' + config.lang + '/wheel/',
            game: WHEEL_DATA.game_data,
            icon: WHEEL_DATA.icon,
            history: WHEEL_DATA.history,
            event: WHEEL_DATA.event,
            settings: WHEEL_DATA.settings,
            game_pixi: null,
            intervalid: 0,
            modal_showed: false,
            modal_game: false,
            modal_game_item: false,
            modal_winner: false,
            modal_winner_item_id: false,
            countdownid: false,
            count_token: 1,
            current_active_spin: -1,
            spin_finished: -1,
            stat: WHEEL_DATA.stat,
            total_cells: 14,
            state: 'waiting',
            is_slowdown: false,
            active_cell: 1,
            laps: 3,
            win_user_offset_px: '30px',
            win_user_offset: 0,
            cell_speed: 50,
            win_item: {
                image: '',
                rarity: '',
                name: '',
                steam_exterior: '',
                steam_is_stattrak: '',
                steam_type: '',
                short_exterior: '',
                steam_price_en: '',
            },
            is_html: false,
            timer_text: 'READY TO START',
        },
        created: function () {
            var self = this;
            socket.emit('wheel');
            if ($('.wheel-canvas-cells').length > 0) this.is_html = true;
            $(document).one('pjax:start', function () {
                socket.emit('leave_wheel');
            });
            if (!this.is_html && typeof (PIXI.Loader.shared.resources["/img/wheel/wheel.png"]) == 'undefined') {
                PIXI.Loader.shared.add("/img/wheel/wheel.png").add("/img/wheel/center_stat.png").add("/img/wheel/users_bg.png").add("/img/wheel/rarity/rare.png").add("/img/wheel/rarity/covert.png").add("/img/wheel/rarity/restricted.png").add("/img/wheel/rarity/milspec.png").add("/img/wheel/rarity/consumer.png").add("/img/wheel/rarity/classified.png").add("/img/wheel/rarity/industrial.png").add("/img/wheel/rarity/contraband.png").add("/img/wheel/rarity/exotic.png").add("/img/wheel/rarity/high.png").add("/img/wheel/rarity/remarkable.png").add("/img/wheel/rarity/extraordinary.png").add("/img/wheel/rarity/base.png").add(this.icon);
            } else {
                $('.wheel-canvas-cells').on('transitionend', function () {
                    self.end_wheel();
                    return;
                });
            }
            Vue.nextTick(function () {
                self.build_circle(function () {
                    if (self.game.state == "finished") {
                        self.start_game();
                    }
                });
            });
        },
        computed: {
            get_deg_circle: function () {
                if (this.is_started) {
                    return (this.laps * 360 * (this.current_active_spin + 1)) + 'deg';
                }
                return '0deg';
            },
            win_cell_index: function () {
                if (this.current_active_spin < 0) return false;
                if (this.game.rolls.length == 0) return false;
                var self = this;
                current_spin = self.game.rolls[this.current_active_spin];
                if (current_spin == undefined) return false;
                var index = 0;
                for (let w of this.weapons) {
                    index++;
                    if (w.id == current_spin.item_id) {
                        return index;
                    }
                }
                return false;
            },
            win_item: function () {
                if (this.current_active_spin < 0) return false;
                if (this.game.rolls.length == 0) return false;
                current_spin = this.game.rolls[this.current_active_spin];
                if (current_spin == undefined) return false;
                return this.game.items[current_spin.item_id];
            },
            weapons: function () {
                return Object.values(this.game.items).map(function (weapon) {
                    return {
                        'image': weapon.steam_image,
                        'id': weapon.id,
                        'rarity': weapon.rarity,
                        'market_hash_name': weapon.steam_market_hash_name,
                        'parsed_name': weapon.parsed_name,
                        'steam_price_en': weapon.steam_price_en,
                        'steam_is_stattrak': weapon.steam_is_stattrak,
                    };
                });
            },
            my_tickets: function () {
                var self = this;
                return Object.values(this.game.tickets).filter(function (a) {
                    return a.user_id == self.user.id;
                });
            },
            total_players: function () {
                return this.users.length;
            },
            is_disabled_bet_button: function () {
                return this.is_loading || this.my_tickets.length >= 5 || this.event.total_token == 0 || this.user.id == null;
            },
            users: function () {
                if (Array.isArray(this.game.tickets)) {
                    return [];
                }
                var self = this;
                let user_ids = [];
                var ids = [];
                Object.values(this.game.tickets).forEach(function (item) {
                    if (user_ids.indexOf(item.user_id) == -1) {
                        user_ids.push(item.user_id);
                        ids.push(item);
                        return true;
                    }
                    return false;
                });
                return ids;
            },
            my_wins: function () {
                var self = this;
                if (typeof self.game === 'undefined' || self.game === null || !self.game.hasOwnProperty('rolls')) {
                    return [];
                }
                var my_win_item = self.game.rolls.filter(function (a) {
                    return a.user_id == self.user.id;
                });
                return my_win_item;
            },
            winners: function () {
                var self = this;
                var result = [];
                var ticket_id;
                for (var i in self.history) {
                    for (var j in self.history[i].rolls) {
                        ticket_id = self.history[i].rolls[j].ticket_id;
                        result.push({
                            user_win_steam_avatarfull: self.history[i].tickets[ticket_id].steam_avatarfull,
                            user_win_steam_personaname: self.history[i].tickets[ticket_id].steam_personaname,
                            win_price: self.history[i].rolls[j].win_price
                        });
                        if (result.length > 30) {
                            return result;
                        }
                    }
                }
                return result;
            },
            calc_win_price_sum: function () {
                return this.my_wins.reduce(function (s, a) {
                    return s + Number(a.win_price);
                }, 0).toFixed(2);
            },
            items_sum: function () {
                if (this.game === null || typeof this.game.items === "undefined") {
                    return 0;
                }
                return Object.values(this.game.items).reduce(function (s, a) {
                    return s + Number(a.steam_price_en);
                }, 0).toFixed(2);
            }
        },
        updated: function () {
            Vue.nextTick(function () {
                $('.owl-carousel').owlCarousel({
                    loop: false,
                    margin: 0,
                    nav: true,
                    items: 1
                });
            });
        },
        watch: {},
        methods: {
            get_win_cell_index: function (current_active_spin) {
                if (this.game.rolls.length == 0) return false;
                var self = this;
                current_spin = self.game.rolls[current_active_spin];
                if (current_spin == undefined) return false;
                var index = 0;
                for (let w of this.weapons) {
                    if (w.id == current_spin.item_id) {
                        _log("win_cell_index", w);
                        return index;
                    }
                    index++;
                }
                return false;
            },
            modalGameInit: function (data) {
                this.modal_game = true;
                this.modal_game_item = data;
            },
            users_from_history: function (tickets) {
                if (Array.isArray(tickets)) {
                    return 0;
                }
                var self = this;
                let user_ids = [];
                Object.values(tickets).forEach(function (item) {
                    if (user_ids.indexOf(item.user_id) == -1) {
                        user_ids.push(item.user_id);
                        return true;
                    }
                    return false;
                });
                return user_ids.length;
            },
            set_state: function (state) {
                this.state = state;
            },
            set_weapons: function (weapons) {
                this.weapons = weapons;
            },
            set_game: function (game) {
                this.game = game;
            },
            set_user_offset: function () {
                var self = this;
                $('.wheel-canvas-center-users-list ul').one('transitionend', function () {
                    self.next_spin();
                    return;
                });
                this.win_user_offset_px = ((((this.users.length) * (Math.round(100 / this.users.length))) + this.win_user_offset) * -35) + 'px';
            },
            start_highlight: function () {
                var self = this;
                var win_cell_index = this.get_win_cell_index(this.current_active_spin);
                setTimeout(function () {
                    if (self.is_started == false) {
                        return false;
                    }
                    if (self.is_slowdown) {
                        self.cell_speed = 300;
                    }
                    if (self.is_slowdown && self.active_cell == win_cell_index) {
                        _log('win_cell_index', win_cell_index);
                        self.end_wheel();
                        self.is_slowdown = false;
                        return false;
                    }
                    if (self.active_cell <= 0) {
                        self.active_cell = 13;
                    } else {
                        self.active_cell--;
                    }
                    self.start_highlight();
                }, this.cell_speed);
            },
            start_html_game: function () {
                var self = this;
                this.state = 'game';
                current_spin = this.game.rolls[this.current_active_spin];
                if (current_spin == undefined) return false;
                _log('current_spin_data', current_spin);
                _log('current_active_spin', this.current_active_spin);
                var win_offset = 0;
                for (let user of this.users) {
                    if (user.user_id == current_spin.user_id) {
                        break;
                    }
                    win_offset++;
                }
                this.win_user_offset = win_offset;
                this.is_started = true;
                this.cell_speed = 100;
                this.win_user_offset_px = 0;
                setTimeout(function () {
                    self.is_slowdown = true;
                }, 6000);
                this.start_highlight();
            },
            next_spin() {
                var self = this;
                self.spin_finished++;
                this.current_active_spin++;
                _log('spin_finished', self.spin_finished);
                if (self.current_active_spin < self.game.level) {
                    self.start_html_game();
                } else {
                    self.is_over = true;
                    _log(self.is_over, self.current_active_spin, self.game.level);
                    if (self.current_active_spin >= self.game.level && self.is_over) {
                        _log('finish, show modal');
                        clearInterval(self.intervalid);
                        setTimeout(function () {
                            if (window.game_pixi != null) {
                                window.game_pixi.toggle_waiting(true);
                            }
                            self.state = 'waiting';
                            self.show_winner_modal();
                            self.is_started = false;
                        }, 2000);
                    }
                }
            },
            end_wheel() {
                this.state = 'users';
                var self = this;
                setTimeout(function () {
                    self.set_user_offset();
                }, 1000);
            },
            start_countdown() {
                var self = this;
                this.countdownid = setInterval(function () {
                    var timeago = self.game.timestamp_start - hget_time();
                    if (timeago > 0) {
                        self.timer_text = format_time(timeago);
                    } else {
                        self.timer_text = 'READY TO START';
                    }
                }, 1000);
            },
            build_circle: function (cb) {
                var self = this;
                if (this.is_html) {
                    if (self.total_players < self.settings.MIN_PLAYERS) {
                        this.state = 'waiting';
                    } else {
                        this.state = 'timer';
                        this.start_countdown();
                    }
                    self.is_loading = false;
                    return false;
                }
                var weapons = Object.values(self.game.items).map(function (weapon) {
                    return {
                        'image': weapon.steam_image,
                        'id': weapon.id,
                        'rarity': weapon.rarity,
                        'market_hash_name': weapon.steam_market_hash_name,
                        'parsed_name': weapon.parsed_name,
                        'steam_price_en': weapon.steam_price_en,
                        'steam_is_stattrak': weapon.steam_is_stattrak,
                    };
                });
                this.weapons = JSON.parse(JSON.stringify(weapons));
                if (!this.is_html && window.game_pixi !== null) {}
                var users = JSON.parse(JSON.stringify(this.users));
                window.game_pixi = new Game(weapons, users, function () {
                    self.is_loading = false;
                    if (self.total_players < self.settings.MIN_PLAYERS) {
                        if (window.game_pixi == null && location.href.includes('wheel')) {}
                        window.game_pixi.toggle_waiting(true);
                    } else {
                        window.game_pixi.toggle_game_timer(self.game.timestamp_start);
                    }
                    window.game_pixi.set_coin_icon(self.icon);
                    window.game_pixi.set_total_tokens(self.game.sum);
                    window.game_pixi.set_game_number('#' + self.game.id);
                    self.$nextTick(function () {
                        $('#wheel-convas').html(window.game_pixi.app.view);
                        if (typeof (cb) == 'function') {
                            cb();
                        }
                    });
                });
            },
            modal_hide: function () {
                this.modal_showed = false;
            },
            start_game: function () {
                var self = this;
                self.current_active_spin = 0;
                self.spin_finished = -1;
                self.is_over = false;
                if (this.is_html) {
                    this.start_html_game();
                    return false;
                }
                window.game_pixi.callback_end_game = function () {
                    self.spin_finished++;
                    _log('spin_finished', self.spin_finished);
                    if (self.current_active_spin < self.game.level) {
                        self.interval_game();
                    } else {
                        self.is_over = true;
                        if (self.current_active_spin >= self.game.level && self.is_over) {
                            _log('finish, show modal');
                            clearInterval(self.intervalid);
                            setTimeout(function () {
                                if (window.game_pixi != null) {
                                    window.game_pixi.toggle_waiting(true);
                                }
                                self.show_winner_modal();
                                self.is_started = false;
                                self.current_active_spin = -1;
                            }, 2000);
                        }
                    }
                };
                setTimeout(function () {
                    self.interval_game();
                }, 1000);
            },
            show_stats: function (data) {
                if (data.casebattle !== undefined) {
                    this.stat.total = this.number_format(data.casebattle);
                }
                if (typeof data.online_casebattle != 'undefined') {
                    this.stat.online = this.number_format(data.online_casebattle);
                }
            },
            interval_game: function () {
                var self = this;
                current_spin = self.game.rolls[self.current_active_spin];
                if (current_spin == undefined) return false;
                window.game_pixi.start_game(self.game.items[current_spin.item_id], current_spin.user_id);
                self.current_active_spin++;
                $('#wheel-convas').html(window.game_pixi.app.view);
            },
            show_winner_modal: function () {
                var self = this;
                if (self.my_wins.length > 0) {
                    self.modal_winner = true;
                }
            },
            socketio_pusher: function (data) {
                var self = this;
                if (self.is_loading) {}
                if (data.game_data.project !== config.PROJECT) {
                    return false;
                }
                if (self.game.state == 'finished' && data.game_data.state !== "finished" && self.is_over && self.game.id !== data.game_data.id) {
                    clearInterval(self.intervalid);
                    Vue.set(self, 'game', data.game_data);
                    self.build_circle();
                    return false;
                }
                if (this.game.id !== data.game_data.id && data.game_data.state != "finished") {
                    return false;
                }
                Vue.set(self, 'game', data.game_data);
                self.is_loading = true;
                self.$nextTick(function () {
                    if (self.game.state == 'finished' && self.is_started == false) {
                        self.build_circle();
                        self.$nextTick(function () {
                            self.is_started = true;
                            self.is_over = false;
                            self.start_game();
                        });
                        return false;
                    }
                    if (self.is_started == false) {
                        self.build_circle();
                    }
                });
            },
            make_bet: function () {
                var self = this;
                if (self.is_disabled_bet_button) return false;
                if (self.event.total_token == 0) return false;
                self.is_loading = true;
                $.ajax({
                    url: this.path + 'join',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id: this.game.id
                    },
                    success: function success(data) {
                        setTimeout(function () {
                            if (data.status == 'success') {
                                self.is_loading = false;
                                if (data.balance) {
                                    self.event.total_token = data.balance;
                                }
                                ShowMsg(localization.success, 'Your token has been placed on the wheel.', 'success', 2000);
                            } else {
                                show_notification_error(data.error_message);
                            }
                        }, 1000);
                    }
                });
            },
            fetch_images: function (cb) {
                var self = this;
                var images_loaded = 0;
                var max_items = Object.values(self.game.items).length;
                $.each(Object.values(self.game.items), function (idx, item) {
                    if (idx >= max_items) {
                        return false;
                    }
                    var img = new Image();
                    img.src = item.steam_image;
                    img.onload = function () {
                        images_loaded = images_loaded + 1;
                        if (images_loaded === max_items) {
                            if (typeof (cb) === 'function') {
                                cb();
                            }
                            return false;
                        }
                    };
                });
            },
            get_game: function (id) {
                var self = this;
                $.ajax({
                    url: this.path + 'get_game_data/' + id,
                    type: 'GET',
                    dataType: 'json',
                    data: {},
                    success: function success(data) {
                        Vue.set(self, 'game', data);
                    }
                });
            },
            get_last_game: function () {
                var self = this;
                $.ajax({
                    url: this.path + 'get_game_data',
                    type: 'GET',
                    dataType: 'json',
                    data: {},
                    success: function success(data) {
                        self.game = data;
                    }
                });
            },
            get_history: function () {},
            show_win_item: function () {},
            sell_mass: function (wins) {
                this.modal_showed = false;
                this.modal_winner = false;
                this.modal_game = false;
                var ids = wins.map(function (a) {
                    return a.open_id;
                });
                $.ajax({
                    url: '/' + config.lang + '/profile/sell_mass',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        ids: ids.join(","),
                    },
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            updateBalance(data.balance);
                            ShowMsg(localization.success, localization.items_sold.format(ids.length), 'success', 3000);
                        } else {
                            ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                        }
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                });
            },
        },
    });
}

function livedrop_initialize() {
    pjax_fix('.drop_cont');
    window.livedrop_app = new Vue({
        el: '.drop_cont',
        data: {
            items: [],
        },
        created: function () {},
        methods: {
            add_item: function (item) {
                this.items.unshift(JSON.parse(item));
                if (this.items.length > 17) {
                    this.items.pop();
                }
            },
            get_exterior: function (ex) {
                var arr = ex.match(/([A-Z])/g);
                if (arr == null || arr.length == 0) return '';
                return arr.join('');
            },
            add_items: function (items) {
                var self = this;
                $.each(items.reverse(), function (index, item) {
                    self.add_item(item);
                });
            },
            get_time: function (date) {
                return moment(moment.utc(date).toDate()).format('YYYY-MM-DD HH:mm:ss');
            },
            case_image: function (c) {
                return get_case_image(c, c.game.toLowerCase());
            }
        }
    });
    socket.on('caseFinished', function (data) {
        if (livedrop == 'off') return false;
        window.livedrop_app.add_item(data);
    });
    socket.on('casesFinished', function (data) {
        if (livedrop == 'off') return false;
        window.livedrop_app.add_items(data);
    });
}
var openingCase = false;
var weapons = [];
var event_tokens = {};
var shards = [];
var is_bundle = 0;
var open_case_id = 0;
var need_show_loading = false;
var hasStorage = (typeof (Storage) !== "undefined");
var drop = getFromStorage('drop');
var rates = getFromStorage('rates');
var livedrop = getFromStorage('livedrop');
var cn_vpn = getFromStorage('cn_vpn');
var cn_vpn2 = getFromStorage('cn_vpn2');
if (drop == null) drop = 'lucky';
if (rates == null) rates = 'no';
if (livedrop == null) rates = 'on';
var isMobile = false;
registerListener('load', lazyLoad);
registerListener('scroll', lazyLoad);
registerListener('resize', lazyLoad);

function storeAnalytics() {
    return false;
}
(function (factory) {
    var registeredInModuleLoader = false;
    if (typeof define === 'function' && define.amd) {
        define(factory);
        registeredInModuleLoader = true;
    }
    if (typeof exports === 'object') {
        module.exports = factory();
        registeredInModuleLoader = true;
    }
    if (!registeredInModuleLoader) {
        var OldCookies = window.Cookies;
        var api = window.Cookies = factory();
        api.noConflict = function () {
            window.Cookies = OldCookies;
            return api;
        };
    }
}(function () {
    function extend() {
        var i = 0;
        var result = {};
        for (; i < arguments.length; i++) {
            var attributes = arguments[i];
            for (var key in attributes) {
                result[key] = attributes[key];
            }
        }
        return result;
    }

    function init(converter) {
        function api(key, value, attributes) {
            var result;
            if (typeof document === 'undefined') {
                return;
            }
            if (arguments.length > 1) {
                attributes = extend({
                    path: '/'
                }, api.defaults, attributes);
                if (typeof attributes.expires === 'number') {
                    var expires = new Date();
                    expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
                    attributes.expires = expires;
                }
                attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';
                try {
                    result = JSON.stringify(value);
                    if (/^[\{\[]/.test(result)) {
                        value = result;
                    }
                } catch (e) {}
                if (!converter.write) {
                    value = encodeURIComponent(String(value)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
                } else {
                    value = converter.write(value, key);
                }
                key = encodeURIComponent(String(key));
                key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
                key = key.replace(/[\(\)]/g, escape);
                var stringifiedAttributes = '';
                for (var attributeName in attributes) {
                    if (!attributes[attributeName]) {
                        continue;
                    }
                    stringifiedAttributes += '; ' + attributeName;
                    if (attributes[attributeName] === true) {
                        continue;
                    }
                    stringifiedAttributes += '=' + attributes[attributeName];
                }
                return (document.cookie = key + '=' + value + stringifiedAttributes);
            }
            if (!key) {
                result = {};
            }
            var cookies = document.cookie ? document.cookie.split('; ') : [];
            var rdecode = /(%[0-9A-Z]{2})+/g;
            var i = 0;
            for (; i < cookies.length; i++) {
                var parts = cookies[i].split('=');
                var cookie = parts.slice(1).join('=');
                if (cookie.charAt(0) === '"') {
                    cookie = cookie.slice(1, -1);
                }
                try {
                    var name = parts[0].replace(rdecode, decodeURIComponent);
                    cookie = converter.read ? converter.read(cookie, name) : converter(cookie, name) || cookie.replace(rdecode, decodeURIComponent);
                    if (this.json) {
                        try {
                            cookie = JSON.parse(cookie);
                        } catch (e) {}
                    }
                    if (key === name) {
                        result = cookie;
                        break;
                    }
                    if (!key) {
                        result[name] = cookie;
                    }
                } catch (e) {}
            }
            return result;
        }
        api.set = api;
        api.get = function (key) {
            return api.call(api, key);
        };
        api.getJSON = function () {
            return api.apply({
                json: true
            }, [].slice.call(arguments));
        };
        api.defaults = {};
        api.remove = function (key, attributes) {
            api(key, '', extend(attributes, {
                expires: -1
            }));
        };
        api.withConverter = init;
        return api;
    }
    return init(function () {});
}));

function payout_all() {
    var confirm_text = $('.payout_all').data('confirm');
    if (confirm(confirm_text)) {
        $.ajax({
            url: '/' + config.lang + '/profile/items_cost',
            type: 'POST',
            success: function (data) {
                sell_all_items(function (balance) {
                    payout_items(data.cost);
                }, true);
            }
        });
    }
}

function payout_items(cost) {
    if (cost === undefined) {
        cost = 0;
    }
    if (cost > 0) {
        show_payout(cost);
    }
}
$(document).mouseup(function (e) {
    if (!$(".lang").is(e.target) && $(".lang").has(e.target).length === 0) {
        $('.select_lang').slideUp(100);
        $('.select_lang').removeClass('open');
    }
    if (!$(".switch_game").is(e.target) && $(".switch_game").has(e.target).length === 0) {
        $('.switch_game').removeClass('open');
    }
});
$(document).on('ready', function () {
    isMobile = ($('#header .show_menu:visible').length > 0);
    $('.select_game.active').click(function () {
        $(this).closest('.projects').toggleClass('open');
        return false;
    });
    if (opener !== null && config.LOGIN_IS_POPUP_AUTH > 0) {
        try {
            opener.location.replace(opener.location.pathname + opener.location.search + opener.location.hash);
            window.close();
        } catch (e) {
            console.error(e);
        }
    }
    if (livedrop == 'off') {
        $('#live_drop').toggleClass('hide_live');
        $('#main').toggleClass('full');
    }
    livedrop_initialize();
    socket_bind();
    if (ouibounce != undefined && config.FREECASE_MODAL_ACTIVE == 1 && config.lang != 'cn') {
        ouibounce($('.free_case')[0], {
            aggressive: false,
            callback: function () {
                ShowFreeCaseModal();
            }
        });
    }
});
$('.steamLoginButton, .steam_popup').click(function (e) {
    if (config.LOGIN_IS_POPUP_AUTH > 0) {
        var status = login('/login', '_blank', '800', '600');
        return !status;
    }
});
$('#open_gw').click(function () {
    var url = $(this).data('url');
    var bg = $(this).data('bg');
    if (isMobile) {
        location.href = url;
        return false;
    }
    if (config.lang == 'cn') {
        window.open(url, '_blank');
        return false;
    }
    show_giveaway(url, bg);
});
$('.switch_toggle').click(toggle_livedrop);
$('#live_drop .switch a').click(function () {
    var d = $(this).data('drop');
    $('#live_drop .switch a').removeClass('active');
    $(this).addClass('active');
    setToStorage('drop', d);
    drop = d;
    $('.drop_cont > .item').remove();
    if (drop == Hell.DROP_TYPE_BEST) {
        window.socket_io.emit('switchToBest');
    } else if (drop == Hell.DROP_TYPE_TOP24) {
        window.socket_io.emit('switchToTop24');
    } else {
        window.socket_io.emit('switchToAll');
    }
});
$(document).on('ready pjax:end', function (xhr, options) {
    moment.fn.fromNowOrSeconds = function (bool) {
        var
            diff_msecs = moment().diff(this),
            diff_secs = Math.floor(diff_msecs / 1000),
            locale = moment.locale(),
            str_just_now = 'just now',
            str_ago = ' ago';
        if (diff_secs <= 0) {
            return str_just_now;
        }
        if (diff_secs > 0 && diff_secs < 60) {
            return diff_secs + ' ' +
                get_plural_secs(diff_secs, locale) +
                str_ago;
        }
        return this.fromNow(bool);
    };
    if ($('.faq_page').length > 0) {
        payout_model.show.faq();
    }
    if (typeof (lazyLoad) == 'function') {
        lazyLoad();
    }
    if ($('#items').length == 1) {
        initialize_items();
    }
    if (options != undefined) {
        if (options.getResponseHeader('refresh') == 1) {
            reconnectSock();
        }
    }
    bind_odometer();
    if (typeof (user.total_pending_payouts) != 'undefined' && user.total_pending_payouts > 0) {
        $('.user .balance .withdraw-wrap').css({
            'display': 'inline-block'
        });
        $('.user .balance .withdraw-wrap .count').text(user.total_pending_payouts);
        if (user.total_pending_payouts > 1) {
            $('.user .balance .withdraw-wrap').addClass('many');
        }
    }
    $('.switch_game > a').click(function () {
        $(this).parent().toggleClass('open');
    });
    if ($('.case_open__hotkeys').length > 0) {
        hotkeys();
    }
    $('#self_subscribe, .self_subscribe, .btn-subscribe .subscribe, .proceed-payment').off().click(function () {
        if (user.id == null) {
            ShowNeedAuthModal();
            return;
        }
        try {
            ga('newTracker.send', 'event', 'Funnel', 'premium_pop_sub');
        } catch (e) {
            console.log('[GA] Error  ' + e.name + ":" + e.message);
        }
        show_subscibe_modal();
        return false;
    });
    if ($('.buy_game').length == 1) {
        $('.buy_game').off();
        $('.buy_game').click(buy_game);
    }
    if ($('.buy_item').length > 0) {
        $('.buy_item').off();
        $('.buy_item').click(buy_item);
    }
    $('.switch a').removeClass('active');
    $('body').removeClass('is-modal');
    $('.mobile-menu').fadeOut('fast');
    $('.switch a[data-drop=' + drop + ']').addClass('active');
    var global_domain = '.hellcase.' + document.location.hostname.split('.')[document.location.hostname.split('.').length - 1];
    if (Cookies.get('gdpr_accept', {
            domain: global_domain
        }) != null) {
        $('.gdpr-notice').addClass('hide');
        $('.float-question').removeClass('push');
    }
    $('.gdpr-close').click(function () {
        Cookies.set('gdpr_accept', '1', {
            domain: global_domain,
            expires: 365
        });
        $('.gdpr-notice').addClass('hide');
        $('.float-question').removeClass('push');
    });
    var c_path = location.pathname.split('/')[2];
    var c_path_param = location.pathname.split('/')[3];
    var hash = location.hash;
    openingCase = false;
    $('.hide_profile_toggle .checkbox').click(function () {
        var type = $(this).data('id');
        $.post('/' + config.lang + '/profile/toggle_private', {
            type: type
        }, function (result) {
            if (result.status == Hell.RESPONSE_STATUS_SUCCESS) {
                $('.hide_profile_toggle .checkbox').toggleClass('checked');
                ShowMsg(localization.success, localization[result.message], 'success', 3000);
            }
        });
    });
    $('#history h2 a').click(function () {
        var cl = $(this).data('toggle');
        $('#history h2 a').removeClass('active');
        $(this).addClass('active');
        $('.modal#history table').hide();
        $('.modal#history table.' + cl).show();
    });
    $('.click_to_copy').click(function () {
        $(this).select();
        document.execCommand("copy");
    });
    $('.mob-profile .settings').click(function () {
        if ($(this).hasClass('hide')) {
            $('.settings-panel').removeClass('hide');
            $(this).removeClass('hide');
        } else {
            $('.settings-panel').addClass('hide');
            $(this).addClass('hide');
        }
    });
    $('.mob-profile .statistic').click(function () {
        if ($(this).hasClass('hide')) {
            $(this).removeClass('hide');
        } else {
            $(this).addClass('hide');
        }
    });
    $('.hell-alert-scam .close').click(function () {
        $('.hell-alert-scam').slideUp('slow');
        Cookies.set('alert_scam', '1');
    });
    $('.items_container .heading').click(function (e) {
        var id = $(this).parent().attr('id');
        $(this).parent().toggleClass('hide');
        Cookies.set('items-' + id, $(this).next('.container:visible').length);
    });
    $('#warning_close').click(function () {
        $('#warning_message_danger,#warning_message_info').slideUp('fast');
    });
    $(".scrollto").click(function (event) {
        var id = $(this).attr('href');
        $('html, body').animate({
            scrollTop: $(id).offset().top
        }, 2000);
        return false;
    });
    $('.action-button .btn-premium').click(function () {
        if (user.id == null) {
            ShowNeedAuthModal();
            return;
        }
        show_subscibe_modal();
    });
    if (rates == 'yes') {
        $('#drop_rates').addClass('checked');
        $('#drop_rates a').removeClass('hellcase-btn-default');
        $('#drop_rates a').addClass('hellcase-btn-success');
        $('.odds').show();
    } else {
        $('.odds').hide();
        $('#drop_rates a').addClass('hellcase-btn-default');
        $('#drop_rates a').removeClass('hellcase-btn-success');
    }
    $('#drop_rates').click(function () {
        if ($(this).hasClass('checked')) {
            $(this).removeClass('checked');
            setToStorage('rates', 'no');
            rates = 'no';
            $('.odds').fadeOut('slow');
            $('#drop_rates a').addClass('hellcase-btn-default');
            $('#drop_rates a').removeClass('hellcase-btn-success');
        } else {
            $(this).addClass('checked');
            setToStorage('rates', 'yes');
            rates = 'yes';
            $('.odds').fadeIn('slow');
            $('#drop_rates a').removeClass('hellcase-btn-default');
            $('#drop_rates a').addClass('hellcase-btn-success');
        }
    });
    $('#confirm_email.reward-button').click(function () {
        var email = $('#email.reward-input:valid').val();
        if (email !== '') {
            $.ajax({
                url: '/' + config.lang + '/profile/change_email',
                type: 'POST',
                dataType: 'json',
                data: {
                    email: email
                },
                success: function (result) {
                    if (result.status == Hell.RESPONSE_STATUS_SUCCESS) {
                        $('#email.reward-input').attr('disabled', 'disabled');
                        $('#confirm_email.reward-button').addClass('disabled');
                        $('.rewards li').removeClass('open');
                        ShowMsg(localization.success, localization[result.message], 'success', 3000);
                    } else {
                        show_notification_error(result.error_message);
                    }
                },
                error: function () {
                    show_notification_error('unknown_error');
                }
            })
        }
    });
    $('.rewards li:not(.active) .reward-btn').click(function () {
        var $cur = $(this).closest('li');
        if ($cur.hasClass('open')) {
            $cur.removeClass('open');
            return false;
        }
        $('.rewards li').removeClass('open');
        $cur.addClass('open');
    });
    if (c_path == 'profile') {
        storeAnalytics();
        load_profile();
    }
    if (c_path == 'multicase') {
        multicase_initialize();
    }
    $('#overlay').fadeOut('fast');
    if (window.ga) {
        ga('set', 'page', location.pathname);
        window.ga('send', 'pageview');
    }
    if (location.pathname.split('/').length > 2 == false) {
        updateStats();
    }
    window.onhashchange = locationHashChanged;
    locationHashChanged();
    item_info.icon_actions();
    $("#overlay").click(function () {
        hide_overlay();
    });
    show_cn_modals(false);
    $('.modal-login-form .close a').click(function () {
        $('.modal-login-form,#overlay').fadeOut('fast');
    });
    $('.guest .hell-profile-submenu a, .switch-section a').click(function (e) {
        var id = $(this).attr('href');
        if (id[0] !== '#') return true;
        $('.hell-profile-submenu a').removeClass('active');
        $('.switch-section a').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').hide();
        $(id).show();
        return false;
    });
    $('.sign-login-password').click(function (e) {
        e.preventDefault();
        if (grecaptcha.getResponse().length === 0) {
            ShowMsg(localization.error, localization.login_recaptcha_not_passed, 'error', 3000);
            return;
        }
        var username = $("#sign-form input[name='email']").val();
        var password = $("#sign-form input[name='password']").val()
        $.ajax({
            url: '/' + config.lang + '/log/authorize',
            type: 'POST',
            dataType: 'json',
            data: {
                username: username,
                password: password
            },
            success: function (data) {
                if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                    ShowMsg(localization.success, localization.is_sold, 'success', 3000);
                    location.reload();
                } else {
                    show_notification_error(data.error_message);
                }
            },
            error: function () {
                show_notification_error('unknown_error');
            }
        })
    })
    $('.verify_account').change(function (e) {
        $('.user-info-container').fadeOut('fast');
        var c = this.value;
        var val = validateTradeLink(c);
        if (!val) {
            show_notification_error(localization.save_trade_badurl);
            return;
        }
        $.ajax({
            url: '/' + config.lang + '/log/verify_check',
            type: 'POST',
            dataType: 'json',
            data: {
                link: c,
            },
            success: function (data) {
                if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                    $('.user-info-container .username').text(data.content.personaname);
                    $('.user-info-container .avatar img').attr('src', data.content.avatarfull);
                    $('.user-info-container').fadeIn('fast');
                    ShowMsg(localization.success, localization.success, 'success', 3000);
                } else {
                    show_notification_error(data.error_message);
                }
            },
            error: function () {
                show_notification_error('unknown_error');
            }
        })
    })
    $('.sign-lost-password').click(function (e) {
        e.preventDefault();
        if (grecaptcha.getResponse().length === 0) {
            ShowMsg(localization.error, localization.login_recaptcha_not_passed, 'error', 3000);
            return;
        }
        var username = $("#lostpassword-form input[name='email']").val();
        $.ajax({
            url: '/' + config.lang + '/log/lostpassword',
            type: 'POST',
            dataType: 'json',
            data: {
                username: username,
                recaptcha: grecaptcha.getResponse()
            },
            success: function (data) {
                grecaptcha.reset(recaptchaLostPassword);
                if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                    $('#lostpassword-form').hide();
                    $('#lostpassword-success-form').show();
                    ShowMsg(localization.success, localization.success, 'success', 3000);
                } else {
                    show_notification_error(data.error_message);
                }
            },
            error: function () {
                grecaptcha.reset(recaptchaLostPassword);
                show_notification_error('unknown_error');
            }
        })
    })
    $('.sign-signup').click(function (e) {
        e.preventDefault();
        if (grecaptcha.getResponse().length === 0) {
            ShowMsg(localization.error, localization.login_recaptcha_not_passed, 'error', 3000);
            return;
        }
        var username = $("#signup-form input[name='email']").val();
        var password = $("#signup-form input[name='password']").val()
        $.ajax({
            url: '/' + config.lang + '/log/signup',
            type: 'POST',
            dataType: 'json',
            data: {
                username: username,
                password: password,
                recaptcha: grecaptcha.getResponse()
            },
            success: function (data) {
                grecaptcha.reset(recaptchaSignUp);
                if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                    $('#signup-form').hide();
                    $('#signup-success-form').show();
                    ShowMsg(localization.success, localization.login_registration_success, 'success', 3000);
                } else {
                    show_notification_error(data.error_message);
                }
            },
            error: function () {
                grecaptcha.reset(recaptchaSignUp);
                show_notification_error('unknown_error');
            }
        })
    })
    $('.steamLoginButton, .steam_popup').click(function () {
        try {
            ga('newTracker.send', 'event', 'Funnel', 'PreLogin');
        } catch (e) {
            console.log('[GA] Error  ' + e.name + ":" + e.message);
        }
    })
    $('.free_case-action-btn').click(function () {
        try {
            ga('newTracker.send', 'event', 'Funnel', 'Get Free Case');
        } catch (e) {
            console.log('[GA] Error  ' + e.name + ":" + e.message);
        }
    })
    $('.selected_lang').off();
    $('body').removeClass('open');
    $('.selected_lang').click(function () {
        $('.select_lang').hide();
        $(this).parent().toggleClass('open');
        $(this).next('.select_lang').slideToggle(100);
    })
    $('#btnSell').click(function () {
        $.ajax({
            url: '/' + config.lang + '/profile/sell/',
            type: 'POST',
            dataType: 'json',
            data: {
                id: open_case_id
            },
            success: function (data) {
                if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                    updateBalance(data.balance);
                    $("#btnSell").hide();
                    $("#btnToContract").hide();
                    ShowMsg(localization.success, localization.is_sold, 'success', 3000);
                } else {
                    ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                }
            },
            error: function () {
                show_notification_error('unknown_error');
            }
        })
    });
    $('#btnSellAll,.sell_all').click(function () {
        var ids = weapons.map(function (elem) {
            if (elem.steam_trade_offer_state != Hell.STEAM_TRADE_OFFER_STATE_SOLD) {
                return elem.id;
            }
        }).join(",");
        var sum = 0;
        var arr = weapons.map(function (elem) {
            if (elem.steam_trade_offer_state != Hell.STEAM_TRADE_OFFER_STATE_SOLD) {
                return Number(elem.steam_price_en);
            }
        })
        for (var i in arr) {
            if (arr[i] !== undefined) {
                sum += arr[i];
            }
        }
        $.ajax({
            url: '/' + config.lang + '/profile/sell_mass',
            type: 'POST',
            dataType: 'json',
            data: {
                ids: ids,
                sum: sum.toFixed(2)
            },
            success: function (data) {
                if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                    updateBalance(data.balance);
                    reload_page();
                    ShowMsg(localization.success, localization.is_sold, 'success', 3000);
                } else {
                    ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                }
            },
            error: function () {
                show_notification_error('unknown_error');
            }
        })
    });
    $('.take_game').click(function () {
        console.error('deprecated');
        var self = $(this).closest('.item');
        var id = self.attr('data-id');
        if ($('#js-profile').length > 0) return;
        self.find('.sell').hide();
        self.find('.take_game').text(localization.show_game);
        self.find('.contract-btn').hide();
        self.find('.upgrade-btn').hide();
        self.find('.price').show();
        show_game_code_modal(id);
    });
    $("#btnSaveTradeUrl").click(function () {
        $('#warning-tradelink').val($('input.edit_link').val());
    });
    $(".mob-profile .trade-url form").submit(function () {
        var tradelink = $('.mob-profile .trade-url .link').val();
        save_trade_link(tradelink, function () {
            $('.settings-panel').addClass('hide');
            $(this).addClass('hide');
            ShowMsg(localization.success, localization.save_trade_goodurl, 'success', 3000);
        }, function () {
            ShowMsg(localization.error, localization.save_trade_badurl, 'error', 3000);
        });
    });
    $(".mob-profile .trade-url .button").click(function () {
        var tradelink = $('.mob-profile .trade-url .link').val();
        save_trade_link(tradelink, function () {
            $('.settings-panel').addClass('hide');
            $(this).addClass('hide');
            ShowMsg(localization.success, localization.save_trade_goodurl, 'success', 3000);
        }, function () {
            ShowMsg(localization.error, localization.save_trade_badurl, 'error', 3000);
        });
    });
    $('.js_add_email_modal').click(function () {
        show_add_email_modal();
    });
    $('.js_resend_email').click(function () {
        $.ajax({
            url: '/' + config.lang + '/profile/email_resend',
            type: 'POST',
            dataType: 'json',
            success: function (result) {
                if (result.status == Hell.RESPONSE_STATUS_SUCCESS) {
                    ShowMsg(localization.success, localization[result.message], 'success', 3000);
                } else {
                    show_notification_error('unknown_error');
                }
            }
        })
    });
    $('.add_email_modal .add_email_button').click(function (e) {
        var email = $('#add_email_modal_form_email:valid').val();
        if (email !== '') {
            $.ajax({
                url: '/' + config.lang + '/profile/change_email',
                type: 'POST',
                dataType: 'json',
                data: {
                    email: email
                },
                success: function (result) {
                    if (result.status == Hell.RESPONSE_STATUS_SUCCESS) {
                        $('.add_email_modal').fadeOut('slow');
                        hide_overlay();
                        ShowMsg(localization.success, localization[result.message], 'success', 3000);
                    } else {
                        show_notification_error(result.error_message);
                    }
                },
                error: function () {
                    show_notification_error('unknown_error');
                }
            })
        }
    });
    $("#btnSaveTradeUrl, .warning-popup a.check").click(function () {
        if ($("#btnSaveTradeUrl").hasClass('disabled')) {
            return false;
        }
        var tradelink = $('#warning-tradelink').val();
        if (tradelink == '') {
            tradelink = $('input.edit_link').val();
        }
        $("#btnSaveTradeUrl").addClass('disabled');
        $(".warning-popup a.check").addClass('disabled');
        $("input.edit_link").removeClass('success').removeClass('fail');
        if (!validateTradeLink(tradelink)) {
            show_notification_error('save_trade_badurl');
            $("input.edit_link").addClass("fail");
            return false;
        }
        save_trade_link(tradelink, function (data) {
            if (data.v == "1") var lock_time = 10;
            else var lock_time = 10000;
            setTimeout(function () {
                $("#btnSaveTradeUrl").removeClass('disabled');
                $(".warning-popup a.check").removeClass('disabled');
            }, lock_time);
            var trade_link = parseTradeLink($('input.edit_link').val());
            var span_edit = $('.trade-link span').html();
            if (trade_link) {
                $('.warning-popup').hide();
                hide_overlay();
                $("input.edit_link").addClass("success");
                ShowMsg(localization.success, localization.save_trade_goodurl, 'success', 3000);
                $('.edit_link').css('display', 'none');
                $('.trade-warning').hide();
                $('.trade-link').html('partner=<strong>' + trade_link[1] + '</strong>&amp;token=<strong>' + trade_link[2] + '</strong><i class="hellicon-check-circle-o"></i><span>' + span_edit + '</span>');
                $('.trade-link').show().removeClass('error').addClass('success');
            } else {
                show_notification_error('save_trade_badurl');
                $("input.edit_link").addClass("fail");
                return false;
            }
        }, function (data) {
            if (data.v == "1") var lock_time = 10;
            else var lock_time = 10000;
            setTimeout(function () {
                $("#btnSaveTradeUrl").removeClass('disabled');
                $(".warning-popup a.check").removeClass('disabled');
            }, lock_time);
            if ($('.warning-popup:visible').length > 0) {
                $('#warning-tradelink').val('');
                $("input.edit_link").val('');
            }
            if (data.error_message == "save_trade_badurl" && $('.warning-popup:visible').length == 0 && data.code != 5) {
                show_overlay();
                $('.warning-popup').show();
                $("#overlay, .warning-popup .close").click(function () {
                    $('.warning-popup').hide();
                    hide_overlay();
                });
            }
            $('.warning-popup .list-item').removeClass('checked').removeClass('active');
            switch (data.steam_tradelink_modal) {
                case 'not_own_url':
                    $("input.edit_link").addClass("fail");
                    $('.warning-popup #problem_1').addClass('active');
                    break;
                case 'private_inventory_error':
                    $("input.edit_link").addClass("fail");
                    $('.warning-popup #problem_1').addClass('checked');
                    $('.warning-popup #problem_2').addClass('active');
                    break;
                case 'escrow_error':
                    $("input.edit_link").addClass("fail");
                    $('.warning-popup #problem_1').addClass('checked');
                    $('.warning-popup #problem_2').addClass('checked');
                    $('.warning-popup #problem_3').addClass('active');
                    break;
                case 'should_wait':
                    show_notification_error('should_wait');
                    break;
                case 'save_trade_badurl':
                    show_notification_error('save_trade_badurl');
                    break;
                case 'try_later':
                    show_notification_error('steam_down');
                    break;
                default:
                    show_notification_error('unknown_error');
            }
            $('.problems_checked').text($('.warning-popup .checked').length);
        });
    });
    $(".user_info a.plus, a.btn-add-balance, #addbalance, .add-balance, .js-add-balance").off().click(function () {
        $('.mobile-menu').hide();
        $('body').removeClass('is-modal');
        ShowAddBalanceModal();
    });
    $('.btn-withdraw-balance').click(function () {
        if (getFromStorage('disable_instruction') == null) {
            payout_model.show.instructions();
        } else {
            show_payout(2);
        }
    });
    $('.payout-amount p strong').click(function () {
        var amount = Math.floor($(this).text());
        $('.payout-amount input#amount').val(amount);
    });
    $('.trade-link').click(function () {
        $('.edit_link').css('display', 'inline-block');
        $('input.edit_link').focus();
        $(this).hide();
    });
    $(".modal").not(document.getElementById("win_item_modal_once")).find('a.close').click(function () {
        console.log('depricated');
        if ($('#btnOpening').is(':visible')) {
            $("#btnOpening").hide();
            $("#btnOpen").show();
            $("#btnDropdownChoose").show();
            $(".action-button #cb").show();
            $(".action-button #cb_btn").show();
        }
        hide_overlay();
    });
    $("#overlay").click(function () {
        if ($('#btnOpening').is(':visible')) {
            $("#btnOpening").hide();
            $("#btnOpen").show();
            $("#btnDropdownChoose").show();
            $(".action-button #cb").show();
            $(".action-button #cb_btn").show();
        }
        hide_overlay();
    });
    $("#pay .cont.normalpay a.pay").off().click(function () {
        if ($("#pay .cont input").val() > 0) {
            try {
                ga('newTracker.send', 'event', 'Funnel', 'Pay now');
            } catch (e) {
                console.log('[GA] Error  ' + e.name + ":" + e.message);
            }
            $('#pay .cont form').submit();
        } else {
            ShowMsg(localization.error, localization.wrong_sum, 'error', 3000);
        }
    });
    $("#pay .cont.normalpay input").change(function () {
        var curSum = (Number)(config.pay.min_sum).toFixed(2)
        if (Number(this.value) < curSum && config.lang != 'ru') {
            this.value = curSum;
            ShowMsg(localization.error, localization.min_sum, 'error', 3000);
        }
        if (Number(this.value) < curSum && config.lang == 'ru') {
            this.value = curSum;
            ShowMsg(localization.error, localization.min_sum, 'error', 3000);
        }
    });
    $("#pay .cont.normalpay input").keyup(function () {
        changePercentagePromoSum(this.value)
    });
    $("#pay .cont.normalpay input").change(function () {
        changePercentagePromoSum(this.value)
    });
    $("#pay .cont.promocode a.promo_small").off();
    $("#pay .cont.promocode a.promo_small").click(function () {
        var promo_code = ($("#pay .cont.promocode input").val() != '') ? $("#pay .cont.promocode input").val() : null;
        $("#pay .cont.promocode input").val('');
        use_promocode(promo_code);
    });
    $('#submitRef').click(function () {
        var link = $('.partner_block input[name="link"]').val();
        var info = $('.partner_block textarea[name="info"]').val();
        var mail = $('.partner_block input[name="mail"]').val();
        var subs = $('.partner_block input[name="subs"]').val();
        if (link != '' && info != '' && mail != '' && subs != '') {
            $.ajax({
                url: "/" + config.lang + "/partner/",
                type: 'POST',
                dataType: 'json',
                data: {
                    mail: mail,
                    info: info,
                    link: link,
                    subs: subs,
                },
                success: function (data) {
                    if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                        $('.partner_block input[name="link"]').val('');
                        $('.partner_block textarea[name="info"]').val('');
                        $('.partner_block input[name="mail"]').val('');
                        $('.partner_block input[name="subs"]').val('');
                        ShowMsg(localization.success, localization.success, 'success', 3000);
                    } else {
                        show_notification_error('error');
                    }
                },
                error: function () {
                    show_notification_error('unknown_error');
                }
            })
        } else {
            ShowMsg(localization.error, localization.not_all_field, 'error', 3000);
        }
    });
    $('#submitNewPromoName').click(function () {
        var name = $('input[name="desiredname"]').val();
        if (name != '') {
            $.ajax({
                url: "/" + config.lang + "/partner/desired_name",
                type: 'POST',
                dataType: 'json',
                data: {
                    name: name,
                },
                success: function (data) {
                    if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                        ShowMsg(localization.success, localization.success, 'success', 3000);
                        reload_page();
                    } else {
                        if (typeof (localization["partner_" + data.error_message]) == 'undefined') {
                            show_notification_error(data.error_message);
                        } else {
                            ShowMsg(localization.error, localization["partner_" + data.error_message], 'error', 3000);
                        }
                    }
                },
                error: function () {
                    show_notification_error('unknown_error');
                }
            })
        } else {
            ShowMsg(localization.error, localization.not_all_field, 'error', 3000);
        }
    });
    $('#promocode').keypress(function (e) {
        var c = String.fromCharCode(e.charCode);
        if (!validatePromo(c) || $(this).val().length >= 20) {
            return false;
        }
    });
    $('.modal .promocode input[type=text]').keypress(function (e) {
        var c = String.fromCharCode(e.charCode);
        if (!validatePromo(c)) {
            return false;
        }
    });
    $('.ref-form-head input[name="desiredname"]').keyup(function () {
        $(this).css('width', ($(this).val().length + 2) * 8 + 'px');
    });
    $('.open_farm').click(function () {
        if (openingCase) return;
        openingCase = true;
        $('.open_farm').attr('disabled', 'disabled');
        $('.open_farm').addClass('disabled');
        var cases_count = $(this).data('count');
        $.post("/" + config.lang + "/farm/buy/" + casename + "/" + cases_count, function (data) {
            openingCase = false;
            $('.open_farm').removeAttr('disabled');
            $('.open_farm').removeClass('disabled');
            var cost = casePrice * cases_count;
            try {
                fbq('track', 'Purchase', {
                    value: cost,
                    currency: 'USD'
                });
            } catch (e) {}
            if (data.status == 'error') {
                if (data.error_message == 'need_auth') {
                    ShowNeedAuthModal();
                } else if (data.error_message == 'need_sum') {
                    ShowAddBalanceModal(data.sum);
                } else {
                    show_notification_error(data.error_message);
                }
            } else {
                if (data.balance >= 0) {
                    updateBalance(data.balance);
                }
                farm_modal(data.weapons, data, data.weapons_farm);
            }
        });
    });
    $('#btnOpen').click(function () {
        if (openingCase)
            return;
        openingCase = true;
        if (show_cn_modals(true)) {
            return;
        }
        $("#btnOpen").hide();
        $("#js-take-by-token").hide();
        $(".event-coin").hide();
        $(".roulette-container__event").hide();
        $("#btnDropdownChoose").hide();
        $(".action-button #cb").hide();
        $(".action-button #cb_btn").hide();
        $("#btnOpening").show();
        $.post("/" + config.lang + "/open/" + casename + "/buy/" + cases_count, function (data) {
            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                if (data.balance >= 0) {
                    updateBalance(data.balance);
                }
                open_case_id = data.case_number;
                is_bundle = data.is_bundle | 0;
                var cost = parseFloat($('#titleCaseName').data('caseprice')) * cases_count;
                try {
                    fbq('track', 'Purchase', {
                        value: cost,
                        currency: 'USD'
                    });
                } catch (e) {}
                window._roulettes = [];
                window._roulettes_finished = 0;
                window._roulettes_total = data.weapons.length;
                for (var i in data.weapons) {
                    if (is_bundle > 0) {
                        run_bundle(data.weapons[i], data.bundle);
                    } else {
                        run(data.weapons[i]);
                    }
                }
                weapons = data.weapons;
                shards = data.shards;
                event_tokens = data.event_tokens;
                try {
                    ga('newTracker.send', 'event', 'Funnel', 'Open case');
                } catch (e) {
                    console.log('[GA] Error  ' + e.name + ":" + e.message);
                }
            } else {
                openingCase = false;
                if (data.error_message == 'need_auth') {
                    ShowNeedAuthModal();
                } else if (data.error_message == 'need_sum') {
                    ShowAddBalanceModal(data.sum);
                } else {
                    show_notification_error(data.error_message);
                }
            }
        }, 'json');
    });
    $('#js-take-by-token').click(function () {
        var id = $(this).data('id');
        var event_id = $(this).data('event');
        $.get('/' + config.lang + '/event/buy', {
            event_id: event_id,
            id: id
        }, function (response) {
            if (response.status == 'success') {
                initialize();
            }
            if (response.status == 'error') {
                show_notification_error(response.error_message);
            }
        });
    });
    $('#btn_open_daily_free').click(function () {
        if (openingCase)
            return;
        openingCase = true;
        $("#btn_open_daily_free").hide();
        $("#btnOpening").show();
        $.post("/" + config.lang + "/dailyfree/buy", function (data) {
            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                if (data.balance >= 0) {
                    data.weapons[0].balance = data.balance;
                }
                open_case_id = data.case_number;
                if (typeof (data.case) != 'undefined') {
                    window.case = data.case;
                }
                window._roulettes = [];
                window._roulettes_finished = 0;
                window._roulettes_total = data.weapons.length;
                weapons = data.weapons;
                run(data.weapons[0]);
                try {
                    ga('newTracker.send', 'event', 'Funnel', 'Open Daily Free');
                } catch (e) {
                    console.log('[GA] Error  ' + e.name + ":" + e.message);
                }
            } else {
                openingCase = false;
                if (data.error_message == 'need_auth') {
                    ShowNeedAuthModal();
                } else {
                    $("#btn_open_daily_free").show();
                    $("#btnOpening").hide();
                    show_notification_error(data.error_message);
                }
            }
        }, 'json');
    });
    $('.btnReopen').click(function () {
        reload_page();
    });
    $('#btnDropdownChoose .dropdown ul li a').click(function (e) {
        e.preventDefault();
        var val = $(this).text();
        $(this).closest('.dropdown').find('span').text(val);
        $('#btnOpenPrice,.btnOpenPrice').text(localization.curr + (Number)(casePrice * val).toFixed(2));
        ShowCaseLines(val);
    });
    $('.case_open__select_count.farm li a span').click(function () {
        if ($('.roulette-case-icon.run').length > 0) {
            return false;
        }
        $('.case_open__select_count li').removeClass('active');
        $(this).closest('li').addClass('active');
        var val = $(this).text();
        if ($('.case_open__select_count').hasClass('farm')) {
            $('.open_farm').data('count', val);
            $('#btnOpenPrice,.btnOpenPrice').text(localization.curr + (Number)(casePrice).toFixed(2) + ' x ' + val + ' = ' + localization.curr + (Number)(casePrice * val).toFixed(2));
        } else {
            var price_old_cost = parseFloat($('#titleCaseName').data('price_old')) * val;
            $('.old-price').text(localization.curr + (Number)(price_old_cost).toFixed(2));
            $('#btnOpenPrice,.btnOpenPrice').text(localization.curr + (Number)(casePrice * val).toFixed(2));
            ShowCaseLines(val);
        }
        if ($('#create_battle').length > 0) {
            $('#create_battle').attr('href', '/' + config.lang + '/casebattle#create:' + case_id + '/' + val);
        }
    });
    $('#btnBattle,.btn_battle').click(function () {
        var count = parseInt($('.action-button #cb a strong').text());
        for (var i = 0; i < cases_count; i++) {
            $.ajax({
                url: '/' + config.lang + '/casebattle/creategame/' + case_id,
                type: 'POST',
                dataType: 'json',
                success: function (data) {
                    if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                        updateBalance(data.balance);
                        count = count + 1;
                        $('.action-button #cb a strong').text(count);
                        ShowMsg(localization.success, localization.casebattle_created.format(casetitle), 'success', 2000);
                        location.href = '/' + config.lang + '/casebattle#' + data.game_id;
                    } else {
                        if (data.error_message == 'need_auth') {
                            ShowNeedAuthModal();
                        } else if (data.error_message == 'need_sum') {
                            ShowAddBalanceModal(data.sum);
                        } else if (data.error_message == 'casebattle_no_access') {
                            $('#new_win_modal').fadeOut('slow');
                            ShowSubscribeModal();
                        } else {
                            show_notification_error(data.error_message);
                        }
                    }
                },
                error: function () {
                    show_notification_error('unknown_error');
                }
            });
        }
    });
    $(".modal#caseWin a.close").click(function () {
        reload_page();
    });
});

function locationHashChanged() {
    var hash = location.hash;
    if (hash == '#giveaway') {
        $('#open_gw').click();
    }
    if (hash == '#pay') {
        $(".mobile-menu").hide();
        ShowAddBalanceModal();
    }
    if (hash == '#newsletter') {
        var forms_url = 'https://cdn.forms-content.sg-form.com/9923546f-ee7c-11e9-8f54-9e23e5d187c9';
        if (config.lang == 'tr') forms_url = 'https://cdn.forms-content.sg-form.com/47a382a0-ff9f-11e9-9b0b-c2636454530c';
        if (config.lang == 'es') forms_url = 'https://cdn.forms-content.sg-form.com/8d781735-ff9f-11e9-9b0b-c2636454530c';
        if (config.lang == 'pt') forms_url = 'https://cdn.forms-content.sg-form.com/ce730107-ff9f-11e9-9b0b-c2636454530c';
        if (config.lang == 'br') forms_url = 'https://cdn.forms-content.sg-form.com/0d37f233-ffa0-11e9-9b0b-c2636454530c';
        if (config.lang == 'pl') forms_url = 'https://cdn.forms-content.sg-form.com/4ccc3e9a-ffa0-11e9-9b0b-c2636454530c';
        if (config.lang == 'de') forms_url = 'https://cdn.forms-content.sg-form.com/76f65398-ffa0-11e9-9b0b-c2636454530c';
        if (config.lang == 'fr') forms_url = 'https://cdn.forms-content.sg-form.com/9a2b3ebd-ffa0-11e9-9b0b-c2636454530c';
        if (config.lang == 'cn') forms_url = 'https://cdn.forms-content.sg-form.com/c90cdfe4-ffa0-11e9-9b0b-c2636454530c';
        if (config.lang == 'ru') forms_url = 'https://cdn.forms-content.sg-form.com/15fb83d6-ffa1-11e9-9b0b-c2636454530c';
        show_modal('<iframe src="' + forms_url + '"/>');
    }
    if (hash.indexOf("promo") == 1) {
        $(".mobile-menu").hide();
        var promocode = hash.split(":")[1];
        if (user.id == null) {
            ShowNeedAuthModal();
        } else {
            ShowAddBalanceModal(0, promocode);
        }
        try {
            $(".promocode input[type=text]").val(promocode);
        } catch (error) {}
    }
    var c_path = location.pathname.split('/')[2];
    window.onpopstate = function (event) {
        var loc_cur_case = document.location.href.split('/')[document.location.href.split('/').length - 1];
        if (typeof (window.case_history) != 'undefined' && window.case_history[loc_cur_case] != undefined) {
            window.case_history[loc_cur_case]();
            initialize();
        }
    };
    if (c_path == undefined || c_path == '') {
        if (window.active_giveaways) {
            init_giveaway_info();
        }
        if ($('.items_container--event').length > 0) {
            $('.items_container--event').each(function (index) {
                countdown_main_page_event($(this).data('datetime'), $(this).find('.heading__timer-items'));
            });
        }
    }
    $('#main').removeClass('no_livedrop');
    if (c_path == 'open') {
        case_open();
    }
    if (c_path == 'farm') {
        initialize();
    }
    if (c_path == 'event') {
        event_initialize();
    }
    if (c_path == 'dailyfree') {
        initialize();
    }
    if (c_path == 'contract') {
        contract_initialize();
    }
    if (c_path == 'upgrade') {
        upgrade_initialize();
    }
    if (c_path == 'multicase') {
        multicase_initialize();
    }
    if (c_path == 'share') {
        initialize();
    }
    if (c_path == 'profile') {}
    if (c_path == 'wheel') {
        wheel_initialize();
    }
    if (c_path == 'premium') {
        if (user.is_subscription == 1) {
            premium();
        } else {
            $('#main').addClass('no_livedrop');
        }
    } else {}
}
$(document).on('pjax:success', function (xhr, options) {
    $(".switch_game > a").click(function () {
        $(this).parent().toggleClass("open");
    });
});
$(document).on('ready pjax:end', function (xhr, options) {});

function initialize() {
    if (typeof casename !== 'undefined') {
        var current_line = $('#roulette-container-1');
        current_line.find('.roulette-case-icon').css('background-image', 'url(' + caseIconURL + ')').css('width', '100%');
        if (is_twin_case(category)) {
            current_line.find('.roulette-case-icon').html('<div class="image"></div>');
            current_line.find('.roulette-case-icon .image').css('background-image', 'url(' + caseWeaponURL + ')');
        }
        if ($('.roulette-case-icon').hasClass('share')) {
            $('.left-arrow-share').show();
            $('.background-arrow').show();
        }
        var status_sound = getFromStorage('sound');
        if ($('.hell-timer').length == 1) {
            var datetime = $('.hell-timer').data('time');
            countdown_case(datetime);
        }
        if ($('.info__bottom-content--timer').length == 1) {
            countdown_event_case(event.time_finished, event.time_start, $('.info__bottom-content--timer'));
        }
        preCacheItems();
        $.post('/' + config.lang + '/open/' + casename + '/state', function (data) {
            if (data.bought) {
                weapons = data.weapons;
                shards = data.shards;
                open_case_id = data.case_number;
                $("#btnOpen").hide();
                $("#js-take-by-token").hide();
                $(".event-coin").hide();
                $(".roulette-container__event").hide();
                $("#btnDropdownChoose").hide();
                $(".action-button #cb").hide();
                $(".action-button #cb_btn").hide();
                $("#btnOpening").show();
                is_bundle = data.is_bundle | 0;
                if (is_bundle) {
                    ShowCaseLines(1);
                } else {
                    ShowCaseLines(data.weapons.length);
                }
                window._roulettes = [];
                window._roulettes_finished = 0;
                window._roulettes_total = data.weapons.length;
                for (var i in data.weapons) {
                    if (data.is_bundle > 0) {
                        run_bundle(data.weapons[i], data.bundle);
                    } else {
                        run(data.weapons[i]);
                    }
                }
            }
        }, 'json');
    }
}

function ShowCaseLines(count) {
    cases_count = count;
    $('.roulette-container').hide();
    for (var i = 1; i <= count; i++) {
        var current_line = $('#roulette-container-' + i);
        current_line.show();
        current_line.find('.roulette-case-icon').css('background-image', 'url(' + caseIconURL + ')').css('width', '100%');
        if (is_twin_case(category)) {
            current_line.find('.roulette-case-icon').html('<div class="image"></div>');
            current_line.find('.roulette-case-icon .image').css('background-image', 'url(' + caseWeaponURL + ')');
        }
    }
}

function run_bundle(weapon, bundle) {
    if (typeof casename !== 'undefined') {
        if (typeof weapon.line_id === 'undefined') {
            weapon.line_id = 1;
        }
        var current_line = $('#roulette-container-' + weapon.line_id);
        current_line.find('.roulette-case-icon').fadeOut(200, function () {
            current_line.find('.roulette-case-icon').css('background-image', 'none').html('<div class="preloader active roulette"></div>').addClass('run');
            current_line.find('.roulette-case-icon').fadeIn(200, function () {
                if (weapon.is_item == undefined) {
                    weapon.is_item = true;
                }
                window.roulette = new EvRoulette({
                    weapon_prize_attrs: {
                        weapon_name: bundle.weapon_name,
                        skin_name: bundle.skin_name,
                        rarity: bundle.rarity,
                        steam_image: bundle.steam_image
                    },
                    silent_mode: (weapon.line_id != 1) || getFromStorage('sound') == 'off',
                    weapon_actors_attrs: shuffle(caseInfo),
                    el_parent: document.getElementById('roulette-container-' + weapon.line_id),
                    beforeparty: function () {
                        current_line.find('.roulette-case-icon').fadeOut(200);
                    },
                    afterparty: function () {
                        cases_count = is_bundle;
                        var ids = weapons.map(function (elem) {
                            if (elem.steam_trade_offer_state != Hell.STEAM_TRADE_OFFER_STATE_SOLD) {
                                return elem.id;
                            }
                        }).join(",");
                        $.ajax({
                            url: "/" + config.lang + "/open/" + casename + "/final/0",
                            type: 'POST',
                            data: {
                                ids: ids
                            },
                            success: function (data) {
                                universal_item_modal(weapons, {}, {
                                    share: true,
                                    hotkeys: true,
                                    btn_up: true,
                                    btn_my: true,
                                    btn_sell: true
                                });
                                openingCase = false;
                            },
                            error: function (e) {
                                console.log(e);
                            }
                        });
                    }
                });
                window.roulette.start();
            });
        });
    }
}

function run(weapon) {
    if (typeof casename !== 'undefined') {
        if (typeof weapon.line_id === 'undefined') {
            weapon.line_id = 1;
        }
        var current_line = $('#roulette-container-' + weapon.line_id);
        var share = $('.roulette-case-icon').hasClass('share');
        if (share) {
            $('.left-arrow-share').fadeOut(200, function () {
                $('.left-arrow-share').remove
            });
            $('.background-arrow').fadeOut(200, function () {
                $('.background-arrow').remove
            });
        }
        current_line.find('.roulette-case-icon').fadeOut(200, function () {
            $('.roulette-case-icon').removeClass('share');
            current_line.find('.roulette-case-icon').css('background-image', 'none').html('<div class="preloader active roulette"></div>').addClass('run');
            current_line.find('.roulette-case-wrap').css('display', 'none');
            current_line.find('.roulette-case-icon').fadeIn(200, function () {
                if (weapon.is_item == undefined) {
                    weapon.is_item = true;
                }
                if (weapon.is_item == true) {
                    if (weapon.steam_image.indexOf('.jpg') == -1) {
                        var image = getImage(weapon.steam_image, 360, 360) + '.png';
                    } else {
                        var image = weapon.steam_image;
                    }
                } else {
                    var image = weapon.steam_image;
                }
                if (typeof (weapon.steam_market_hash_name) != 'undefined' && weapon.steam_market_hash_name.indexOf('StatTrak™') !== -1) {
                    weapon.weapon_name = 'StatTrak™ ' + weapon.weapon_name;
                }
                var prize = {
                    weapon_name: $t(weapon.weapon_name),
                    skin_name: $t(weapon.skin_name),
                    rarity: weapon.rarity,
                    steam_image: image
                };
                if (typeof (window.case) != 'undefined' && window.case != null) {
                    prize = {
                        weapon_name: window.case.name,
                        skin_name: 'Item!',
                        rarity: window.case.rarity,
                        steam_image: window.case.steam_image
                    };
                    window.case = null;
                }
                var roulette = new EvRoulette({
                    weapon_prize_attrs: prize,
                    silent_mode: (weapon.line_id != 1) || getFromStorage('sound') == 'off',
                    weapon_actors_attrs: shuffle($i18n.caseInfo(caseInfo)),
                    el_parent: document.getElementById('roulette-container-' + weapon.line_id),
                    beforeparty: function () {
                        current_line.find('.roulette-case-icon').fadeOut(200);
                        $('.hk_open_case').addClass('disabled');
                        $('.hk_stop').removeClass('disabled');
                    },
                    afterparty: function () {
                        $('.hk_sell').removeClass('disabled');
                        $('.hk_repeat').removeClass('disabled');
                        window._roulettes_finished += 1;
                        if (weapon.is_item == false && casename == 'free') {
                            sellSum = (Number)(weapon.steam_price_en).toFixed(2);
                            universal_item_modal([weapon], {}, {});
                            updateBalance(weapon.balance);
                            openingCase = false;
                            return true;
                        }
                        if (casename == 'free' && weapon.is_item == true) {
                            universal_item_modal([weapon], {
                                try_again_cb: function () {
                                    location.reload();
                                }
                            }, {
                                share: true,
                                hotkeys: true,
                                btn_up: true,
                                btn_my: true,
                                btn_sell: true
                            });
                            openingCase = false;
                            return true;
                        }
                        if (is_bundle > 0)
                            cases_count = is_bundle;
                        if (window._roulettes_total >= window._roulettes_finished) {
                            window._roulettes_total = 0;
                            window._roulettes_finished = 0;
                            window._roulettes = [];
                            var ids = weapons.map(function (elem) {
                                if (elem.steam_trade_offer_state != Hell.STEAM_TRADE_OFFER_STATE_SOLD) {
                                    return elem.id;
                                }
                            }).join(",");
                            $.ajax({
                                url: "/" + config.lang + "/open/" + casename + "/final/0",
                                type: 'POST',
                                data: {
                                    ids: ids
                                },
                                success: function (data) {
                                    universal_item_modal(weapons, {
                                        category: category,
                                        event_tokens: event_tokens,
                                        case_price: casePrice,
                                        case_id: case_id,
                                        casename: casename,
                                        shards: shards,
                                        try_again_cb: function () {
                                            Vue.nextTick(function () {
                                                window.case_open_wrap.buy_case(casename, cases_count);
                                            });
                                        }
                                    }, {
                                        btn_try: true,
                                        event_show: config.EVENT_ACTIVE,
                                        shards_show: true,
                                        btn_my: true,
                                        btn_sell: true,
                                        btn_up: true,
                                        btn_cb: true,
                                        hotkeys: true,
                                        share: true
                                    });
                                },
                                error: function (e) {
                                    console.log(e);
                                }
                            });
                        }
                    }
                });
                roulette.start();
                window._roulettes.push(roulette);
            });
        });
    }
}

function show_cn_modals(is_share) {
    var share = false;
    if ($('.roulette-case-icon').length > 0 && $('.roulette-case-icon').hasClass('share')) {
        share = true;
    }
    if (config.lang == 'cn' && cn_vpn == null && user.id == null && share === is_share) {
        show_overlay();
        $('#popup_cn_1').show();
        setToStorage('cn_vpn', 1);
        cn_vpn = 1;
        $('#popup_cn_1 .modal-close, #overlay').click(function () {
            hide_overlay();
            $('#popup_cn_1').hide();
        });
        return true;
    }
    if (config.lang == 'cn' && cn_vpn2 == null && user.id != null) {
        show_overlay();
        $('#popup_cn_2').show();
        $('#popup_cn_2 .modal-close, #overlay').one('click', function () {
            hide_overlay();
            $('#popup_cn_2').hide();
            setToStorage('cn_vpn2', 1);
            cn_vpn2 = 1;
        });
        $('#popup_cn_2 .hellcase-btn-success').one('click', function () {
            hide_overlay();
            $('#popup_cn_2').hide();
            setToStorage('cn_vpn2', 1);
            cn_vpn2 = 1;
            setTimeout(function () {
                ShowAddBalanceModal();
            }, 1000);
        });
    }
    return false;
}
var item_info = {
    icon_actions: function () {
        var switchers = $('.item_info_icon_footer .ext_switch');
        var switchers2 = $('.item_info-weapons-list .exterior-list');
        if (switchers.length !== 0) {
            switchers.on('click', function () {
                var id = $(this).attr('id');
                switchers.removeClass('active');
                $(this).addClass('active');
                $('.exterior-list').removeClass('active');
                $('#' + id + '_list').addClass('active');
                $('.tab-content').hide();
                $('.exterior-text').hide();
                $('.exterior-price').hide();
                $('.exterior-price_statrack').hide();
                $('.buy_item').hide();
                $('#' + id + '_icon').show();
                $('#' + id + '_text').show();
                $('#' + id + '_price').show();
                $('#' + id + '_price_statrack').show();
                $('#item-buy-button-' + id).show();
                $('#item-buy-button-' + id + '_statrack').show();
            });
        }
        if (switchers2.length !== 0) {
            switchers2.on('click', function () {
                var id = $(this).attr('data-id');
                switchers2.removeClass('active');
                $(this).addClass('active');
                $('.item_info_icon_footer .ext_switch').removeClass('active');
                $('#' + id).addClass('active');
                $('.tab-content').hide();
                $('.exterior-text').hide();
                $('.exterior-price').hide();
                $('.exterior-price_statrack').hide();
                $('.buy_item').hide();
                $('#' + id + '_icon').show();
                $('#' + id + '_text').show();
                $('#' + id + '_price').show();
                $('#' + id + '_price_statrack').show();
                $('#item-buy-button-' + id).show();
                if ($('#' + id + '_statrack:empty').length == 0) {
                    $('#item-buy-button-' + id + '_statrack').show();
                } else {
                    $('#item-buy-button-' + id + '_statrack').hide();
                }
            });
        }
    }
}

function buy_game() {
    var id = $(this).data('id');
    $.post('/' + config.lang + '/game/buy', {
        id: id,
    }, function (data) {
        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
            ShowMsg(localization.success, localization[data.message], 'success', 3000);
        } else if (data.status == 'error') {
            show_notification_error(data.error_message);
        }
    });
}

function buy_item() {
    var id = $(this).data('id');
    $.post('/' + config.lang + '/item/buy', {
        id: id,
    }, function (data) {
        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
            casename = data.case_category;
            casePrice = 0;
            cases_count = 0;
            category = data.case_category;
            updateBalance(data.balance);
            universal_item_modal([data.weapons[0]], {}, {
                btn_my: true,
                btn_sell: true,
                btn_up: true,
                hotkeys: true,
                share: true
            });
            $('.tryagain').remove();
        } else if (data.status == 'error') {
            show_notification_error(data.error_message);
        }
    });
}

function initialize_items() {
    if (window.items_html != undefined) {
        $('#items').html(window.items_html);
    } else {
        window.items_html = $('#items').html();
    }
    window.items = new Vue({
        el: '#items',
        data: {
            filters: [],
            category: '',
            filter: '',
            items: [],
            page: 1,
            pages: [],
            pagesCount: 0,
            pageSize: 20,
            searchInput: '',
            sql: '',
            steamGame: 730,
            imageName: '360fx360f.png'
        },
        watch: {
            filters: function (val1, val2) {
                this.filters = val1;
                this.searchItems();
            },
            steamGame: function (val1, val2) {
                if (val1 == 753) {
                    this.imageName = 'header.jpg';
                }
            },
        },
        created: function () {
            if (localStorage.getItem('items.refferer') === 'true') {
                var search = localStorage.getItem('items.search');
                if (search != null) {
                    this.searchInput = search;
                }
                var page = localStorage.getItem('items.page');
                if (page != null) {
                    this.page = parseInt(page);
                }
                var pageSize = localStorage.getItem('items.pageSize');
                if (pageSize != null) {
                    this.pageSize = parseInt(pageSize);
                }
                var filters = localStorage.getItem('items.filters');
                if (filters != null) {
                    this.filters = JSON.parse(filters);
                }
            } else {
                localStorage.removeItem('items.filters');
                localStorage.removeItem('items.search');
                localStorage.removeItem('items.page');
                localStorage.removeItem('items.pageSize');
            }
            localStorage.removeItem('items.refferer')
            this.searchItems();
        },
        methods: {
            getImage: function (item) {
                if (this.steamGame == 753 && (item.no_image == 1)) {
                    return config.HTTPS_CDN_DOMAIN + '/' + this.steamGame + '/mock_img/' + this.imageName;
                }
                return config.HTTPS_CDN_DOMAIN + '/' + this.steamGame + '/' + item.steam_icon_url_large + '/' + this.imageName;
            },
            markRefferer: function () {
                localStorage.setItem('items.refferer', true);
            },
            setPageSize: function (count) {
                this.pageSize = count;
                this.searchItems();
                this.buildPagination();
                localStorage.setItem('items.pageSize', this.pageSize);
            },
            getItemName: function (item) {
                if (item.steam_market_hash_name !== '') {
                    var itemName = item.steam_market_hash_name.split("|");
                    if (itemName.length > 1) {
                        itemName = itemName[0] + '<br \> ' + itemName[1];
                        return itemName;
                    }
                    return item.steam_market_hash_name;
                }
            },
            getItemLink: function (item) {
                if (item.steam_url_title_name == null || item.steam_url_title_name == '') {
                    return '#';
                }
                return '/' + config.lang + '/items/' + item.steam_url_title_name;
            },
            openItem: function (e, item) {},
            checkItem: function (item) {
                if (item.steam_icon_url_large == null || item.steam_icon_url_large == '' || item.steam_url_title_name == '' || item.steam_url_title_name == null) {
                    return false;
                }
                return true;
            },
            getSearchInput: function () {
                localStorage.setItem('items.search', this.searchInput);
                this.searchItems();
            },
            searchItems: function () {
                var self = this;
                var offset = self.page * self.pageSize;
                $.post('/' + config.lang + '/items/search_items', {
                    filters: self.filters,
                    offset: offset,
                    search: self.searchInput,
                    pageSize: self.pageSize,
                    sql: self.sql
                }, function (data) {
                    self.steamGame = data.game
                    self.items = data.items;
                    self.pagesCount = data.count
                    self.buildPagination();
                });
            },
            buildPagination: function () {
                this.pages = [];
                var page = parseInt(this.page);
                var pageAmount = Math.round(this.pagesCount / this.pageSize);
                if (pageAmount > 1) {
                    for (var i = 1; i <= pageAmount; i++) {
                        if ([1, 2, 3].includes(page) && i <= 7) {
                            this.pages.push({
                                active: page === i,
                                number: i
                            });
                        } else if (page + 3 >= i && page - 3 <= i) {
                            this.pages.push({
                                active: page === i,
                                number: i
                            });
                        }
                    }
                }
            },
            choosePage: function (e) {
                this.page = parseInt($(e.target).text());
                this.searchItems();
                this.buildPagination();
                localStorage.setItem('items.page', this.page);
            },
            movePageLeft: function (e) {
                if (this.page > 1) {
                    this.page -= 1;
                    this.searchItems();
                    this.buildPagination();
                }
                localStorage.setItem('items.page', this.page);
            },
            movePageRight: function (e) {
                if (this.page < (this.pagesCount / this.pageSize)) {
                    this.page += 1;
                    this.searchItems();
                    this.buildPagination();
                }
                localStorage.setItem('items.page', this.page);
            },
            addFilter: function (e) {
                var filter = $(e.target).text();
                var filter_category = $(e.target).data('category');
                var flag = 0;
                $.each(this.filters, function (key, val) {
                    if (val.filter == filter) {
                        flag = 1
                    }
                });
                if (flag === 0) {
                    this.filters.push({
                        filter: filter,
                        filter_category: filter_category,
                    });
                }
                var filterStorage = JSON.stringify(this.filters);
                localStorage.setItem('items.filters', filterStorage);
            },
            removeFilter: function (e) {
                var filter = $(e.target).prev().text();
                var self = this;
                $.each(this.filters, function (key, val) {
                    if (val.filter == filter) {
                        self.filters.splice(key, 1);
                        return false;
                    }
                });
                var filterStorage = JSON.stringify(this.filters);
                if (this.filters.length > 0) {
                    localStorage.setItem('items.filters', filterStorage);
                } else {
                    localStorage.removeItem('items.filters');
                }
            },
            resetFilters: function () {
                this.searchInput = '';
                this.filters = [];
                this.items = [];
                this.page = 1;
                localStorage.removeItem('items.filters');
                localStorage.removeItem('items.search');
                localStorage.removeItem('items.page');
                localStorage.removeItem('items.pageSize');
            },
        }
    });
}
window.notice = new Vue({
    el: '#notice',
    data: {
        messages: [],
        sound_all: null,
        sound_item: null,
    },
    created: function () {
        this.sound_all = new Audio(Hell.SOUND_NOTICE_ALL);
        this.sound_all.volume = 0.1;
        this.sound_item = new Audio(Hell.SOUND_NOTICE_ITEM);
        this.sound_item.volume = 0.1;
    },
    methods: {
        add_message: function (message, timeout) {
            var self = this;
            var uniqid = Math.floor(Math.random() * 10000);
            message.id = uniqid;
            message.show = true;
            if (typeof (message.href_title) == 'undefined') {
                if (message.type == Hell.SOCKETIO_PUSHER_GENERIC_CASEBATTLE) {
                    if (typeof (message['href']) != 'undefined') {
                        if (location.href == message['href']) {
                            return false;
                        }
                    }
                    message.href_title = localization.message_btn_watch_now;
                }
                if (message.type == Hell.SOCKETIO_PUSHER_GENERIC_WITHDRAW_MONEY) {
                    message.href_title = localization.message_btn_check;
                }
                if (message.type == Hell.SOCKETIO_PUSHER_GENERIC_SUPPORT) {
                    message.href_title = localization.message_btn_check;
                }
                if (message.type == Hell.SOCKETIO_PUSHER_GENERIC_GIVEAWAY) {
                    message.href_title = localization.message_btn_check;
                }
                if (message.type == Hell.SOCKETIO_PUSHER_GENERIC_WITHDRAW_ITEM) {
                    message.text = localization.notice_item_take + message.text;
                    message.href_title = localization.message_btn_get;
                }
            }
            this.messages.push(message);
            if (typeof (timeout) == 'undefined') {
                timeout = 10000;
            }
            if (timeout > 0) {
                setTimeout(function () {
                    message.show = false;
                    setTimeout(function () {
                        Vue.nextTick(function () {
                            var index = self.messages.findIndex(function (m) {
                                if (m == undefined) return false;
                                return m.id == uniqid;
                            });
                            self.$delete(self.messages, index);
                        });
                    }, 2000);
                }, timeout);
            }
            if (message.type == Hell.SOCKETIO_PUSHER_GENERIC_WITHDRAW_ITEM) {
                this.sound_item.currentTime = 0;
                this.sound_item.play();
            } else {
                this.sound_all.currentTime = 0;
                this.sound_all.play();
            }
        },
        remove_message: function (index) {
            var self = this;
            if (typeof (this.messages[index]['callback']) == 'function') {
                this.messages[index]['callback']();
            }
            this.messages[index].show = false;
            setTimeout(function () {
                self.$delete(self.messages, index);
            }, 1000);
        },
        open_link: function (index) {
            var m = this.messages[index];
            if (typeof (m.href) != 'undefined') {
                if (m.type == Hell.SOCKETIO_PUSHER_GENERIC_CASEBATTLE) {
                    if (location.pathname.split('/')[location.pathname.split('/').length - 1] == 'casebattle') {
                        var battle_id = parseInt(m.href.split('#')[1]);
                        if (battle_id > 0) {
                            window.casebattle.show_game(battle_id);
                            this.remove_message(index);
                            return true;
                        }
                    }
                }
                if (m.href.includes('hellcase')) {
                    location.href = m.href;
                } else {
                    window.open(m.href);
                }
            }
            this.remove_message(index);
        }
    }
});

function ShowMsg(title, text, type, timeout, callback, sticky) {
    window.notice.add_message({
        "title": title,
        "text": text,
        "href": '',
        "type": type,
        "callback": callback,
        "sticky": sticky
    }, timeout);
}

function show_notification_error(error_key, timeout) {
    if (typeof (timeout) == 'undefined') timeout = 10000;
    if (localization[error_key] != undefined) {
        ShowMsg(localization.error, localization[error_key], 'error', timeout);
    } else {
        ShowMsg(localization.error, error_key, 'error', timeout);
    }
}
var contract_tpl = '';

function contract_initialize() {
    if (contract_tpl == '') {
        contract_tpl = $('#pjax-container').html();
    } else {
        $('#pjax-container').html(contract_tpl);
    }
    window.contract = new Vue({
        el: '#pjax-container',
        data: {
            modal_showed: false,
            items: [],
            contract: [],
            win: [],
            contract_sum: 0,
            contract_from: 0,
            contract_to: 0,
            contract_min_c: 0.5,
            contract_max_c: 3,
            contract_max_sum: config.CONTRACT_MAX_PRICE,
            config: config,
            user: user,
            localization: localization,
            dd_open: false,
            selected_type: '',
            working: false,
            filterDropdown: false,
            filterType: false,
            filterExterior: false,
            exteriors: contracts_data.exteriors,
            types: contracts_data.types,
            view_win: false,
            hide_loader: false,
            token: '',
        },
        created: function () {
            var self = this;
            this.items_get();
            Vue.nextTick(function () {
                $(document).click(function (event) {
                    if ($(event.target).closest(".contract-filters").length) return;
                    self.filterDropdown = false;
                    event.stopPropagation();
                });
                $('.contract.blur .contract-final-page-title .close').click(function (e) {
                    e.stopPropagation();
                    self.view_win = false;
                });
                $('.how-contract-works .heading-underline').click(function (e) {
                    $(this).toggleClass('active');
                    $('.how-contract-works .steps').slideToggle('slow');
                });
            });
        },
        methods: {
            filterDropdownShow: function (data) {
                if (this.filterDropdown == data) {
                    this.filterDropdown = false;
                } else {
                    this.filterDropdown = data;
                }
            },
            get_exterior: function (ex) {
                var arr = ex.match(/([A-Z])/g);
                if (arr == null || arr.length == 0) return '';
                return arr.join('');
            },
            round_price: function (price) {
                return currency_calc_amount(parseFloat(price));
            },
            items_get: function () {
                var self = this;
                $.ajax({
                    url: '/' + self.config.lang + '/contract/getitems',
                    type: 'GET',
                    dataType: 'json',
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.items = data.items;
                            self.token = data._token;
                            routie({
                                ':item_id': function (item_id) {
                                    var ids = item_id.split(',');
                                    for (var i = 0; i < ids.length; i++) {
                                        self.add_to_contract(ids[i]);
                                    }
                                },
                                '*': function () {}
                            });
                        } else {
                            show_notification_error(data.error_message);
                        }
                    },
                    error: function () {
                        show_notification_error('unknown_error', 10000);
                    }
                })
            },
            add_to_contract: function (id) {
                var c_path = location.pathname.split('/')[2];
                if (c_path != 'contract') {
                    return;
                }
                if (this.working) {
                    return;
                }
                if (this.contract.length >= 10) {
                    return;
                }
                if (id === false) {
                    if (this.items.length == 0) {
                        return;
                    }
                    if (Number(this.contract_max_sum) < Number(this.contract_sum + Number(this.items[0].steam_price_en))) {
                        ShowMsg(localization.error, localization.contract_max_sum + ' ' + this.contract_max_sum + ' $', 'error', 10000);
                        return;
                    }
                    this.contract.push(this.items[0]);
                    this.items.splice(0, 1);
                } else {
                    for (var i in this.items) {
                        if (this.items[i].id == id) {
                            if (Number(this.contract_max_sum) < Number(this.contract_sum + Number(this.items[i].steam_price_en))) {
                                ShowMsg(localization.error, localization.contract_max_sum + ' ' + this.contract_max_sum + ' $', 'error', 10000);
                                return;
                            }
                            this.contract.push(this.items[i]);
                            this.items.splice(i, 1);
                        }
                    }
                }
                this.recalculate_win_item();
            },
            add_to_contract_all: function () {
                this.add_to_contract(false);
                this.add_to_contract(false);
                this.add_to_contract(false);
                this.add_to_contract(false);
                this.add_to_contract(false);
                this.add_to_contract(false);
                this.add_to_contract(false);
                this.add_to_contract(false);
                this.add_to_contract(false);
                this.add_to_contract(false);
            },
            remove_from_contract: function (id) {
                if (this.working) {
                    return;
                }
                for (var i in this.contract) {
                    if (this.contract[i].id == id) {
                        this.items.push(this.contract[i]);
                        this.contract.splice(i, 1);
                    }
                }
                this.recalculate_win_item();
            },
            recalculate_win_item: function () {
                this.contract_sum = 0;
                for (var i in this.contract) {
                    if (typeof (this.contract[i].steam_price_en) !== 'undefined') {
                        this.contract_sum += Number(this.contract[i].steam_price_en);
                    }
                }
                this.contract_from = this.contract_min_c * this.contract_sum;
                this.contract_to = this.contract_max_c * this.contract_sum;
            },
            make_contract_animated: function () {
                if (this.working) {
                    return;
                }
                this.working = true;
                var self = this;
                if (this.contract.length < 3) {
                    this.working = false;
                    return;
                }
                var ids = this.contract.map(function (elem) {
                    return elem.id;
                }).join(",");
                var exterior = self.filterExterior ? [self.filterExterior] : [];
                var itemtype = self.filterType ? [self.filterType.title] : [];
                $.ajax({
                    url: '/' + self.config.lang + '/contract/make',
                    type: 'post',
                    dataType: 'json',
                    data: {
                        ids: ids,
                        contract_sum: self.contract_sum,
                        exterior: exterior,
                        itemtype: itemtype,
                        _token: this.token
                    },
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.animate_game(function () {
                                preload_images([data.win.steam_image + '/360fx360f.png'], function () {
                                    universal_item_modal([data.win], {
                                        category: 'contract',
                                        casename: 'contract',
                                    }, {
                                        btn_try: true,
                                        btn_my: true,
                                        btn_sell: true
                                    });
                                    updateBalance(data.balance);
                                    self.win = data.win;
                                });
                            }, 3, data.win.rarity);
                        } else {
                            self.working = false;
                            if (data.error_message == 'need_auth') {
                                ShowNeedAuthModal();
                            } else if (data.error_message == 'need_sum') {
                                ShowAddBalanceModal(data.sum);
                            } else {
                                show_notification_error(data.error_message);
                            }
                        }
                    },
                    error: function () {
                        self.working = false;
                        ShowMsg(localization.error, localization.unknown_error, 'error', 10000);
                    }
                })
            },
            item_sell: function (id) {
                var self = this;
                $.ajax({
                    url: '/' + self.config.lang + '/profile/sell',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id: id
                    },
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            updateBalance(data.balance);
                            ShowMsg(localization.success, localization.is_sold, 'success', 3000);
                            location.reload();
                        } else {
                            if (data.error_message) {
                                show_notification_error(data.error_message);
                            } else {
                                ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                            }
                        }
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                })
            },
            animate_game: function (cb, time, final_class) {
                $('.contract-make-action-points li').attr('class', '');
                var index = 0;
                var state = 'add';
                var color = '';
                var colors = 'rare|industrial|consumer|restricted|milspec|covert|remarkable|high|classified|exotic'.split('|');
                var inter = 0;
                var ms = time * 1000 / 15 / 10 / 2;
                color = colors[getRandomInt(0, colors.length - 1)];
                var timer = setInterval(function () {
                    if (state == 'add') {
                        $(".contract-make-action-points li").eq(index).addClass(color);
                    } else {
                        $(".contract-make-action-points li").eq(index).attr('class', '');
                    }
                    if (index == 9) {
                        if (state == 'del') {
                            inter = inter + 1;
                            color = colors[getRandomInt(0, colors.length - 1)];
                            state = 'add';
                            if (inter == ms) {
                                color = final_class;
                            }
                        } else {
                            if (state == 'add') state = 'del';
                        }
                        index = -1;
                    }
                    index = index + 1;
                    if (inter >= ms && state == 'del') {
                        clearInterval(timer);
                        cb();
                    }
                }, 15);
            }
        },
        mounted: function () {},
    });
}

function EvWeapon(a, b) {
    this.id = a;
    this.weapon_name = b.weapon_name;
    this.skin_name = b.skin_name;
    this.rarity = b.rarity;
    this.steam_image = b.steam_image;
    this.el = null
}
EvWeapon.EL_WIDTH = 200;EL_WIDTH = 200;

function EvRoulette(a) {
    this.weapon_prize_attrs = a.weapon_prize_attrs;
    this.weapon_actors_attrs = a.weapon_actors_attrs;
    this.weapons = [];
    this.el_parent = a.el_parent;
    this.el_weapons = this.el = null;
    this.beforeparty = a.beforeparty;
    this.afterparty = a.afterparty;
    this.silent_mode = a.silent_mode;
    this.position = a.position
}
EvRoulette.N_WEAPONS = 31;
EvRoulette.WEAPON_PRIZE_ID = EvRoulette.N_WEAPONS - 5;
EvRoulette.SPIN_SECS = 7;
EvRoulette.START_DELAY_MSECS = 100;
EvRoulette.SOUND_SPIN_INTERVAL = 100;
EvRoulette.IMAGE_LOAD_INTERVAL = 500;
EvRoulette.IMAGE_LOAD_WAIT_MSECS = 1E4;
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
EvRoulette.SOUND_START = config.HTTPS_CDN_DOMAIN + "/hellcase/snd/roulette_start.wav";
EvRoulette.SOUND_SPIN = config.HTTPS_CDN_DOMAIN + "/hellcase/snd/roulette_spin.wav";
EvRoulette.SOUND_STOP = config.HTTPS_CDN_DOMAIN + "/hellcase/snd/roulette_stop.wav";
EvRoulette.sound_spin_object = new Audio(EvRoulette.SOUND_SPIN);
EvRoulette.sound_spin_object.volume = 0.1;
EvRoulette.prototype.set_weapons = function () {
    var a = this,
        b = [],
        d = a.weapon_actors_attrs.length,
        e = 0,
        g = function (g, c) {
            var h;
            for (h = g; h <= c; h += 1) b[h] = new EvWeapon(h, a.weapon_actors_attrs[e]), e = e === d - 1 ? 0 : e + 1
        };
    if (0 === d) throw Error("error");
    g(0, EvRoulette.WEAPON_PRIZE_ID - 1);
    b[EvRoulette.WEAPON_PRIZE_ID] = new EvWeapon(EvRoulette.WEAPON_PRIZE_ID, a.weapon_prize_attrs);
    g(EvRoulette.WEAPON_PRIZE_ID + 1, EvRoulette.N_WEAPONS - 1);
    a.weapons = b
};
EvRoulette.prototype.render = function () {
    var a = this,
        b = document.createElement("div"),
        d = document.createElement("div"),
        e = document.createElement("div"),
        g = 0,
        f = 0,
        c;
    b.id = "ev-roulette";
    d.className = "ev-target";
    e.id = "ev-weapons";
    e.style.width = EvRoulette.N_WEAPONS * EvWeapon.EL_WIDTH + "px";
    a.weapons.forEach(function (a) {
        var b = document.createElement("div"),
            c = document.createElement("div"),
            d = document.createElement("div"),
            f = document.createElement("img"),
            k = document.createElement("div"),
            l = document.createElement("p"),
            m = document.createElement("p");
        f.onload = function () {
            g += 1
        };
        f.src = a.steam_image;
        f.alt = a.weapon_name;
        l.textContent = a.weapon_name;
        m.textContent = a.skin_name;
        b.className = "ev-weapon";
        c.className = "ev-weapon-inner";
        d.className = "ev-weapon-rarity ev-weapon-rarity-" + a.rarity;
        k.className = "ev-weapon-text";
        k.appendChild(l);
        k.appendChild(m);
        c.appendChild(d);
        c.appendChild(f);
        c.appendChild(k);
        b.appendChild(c);
        a.el = b;
        e.appendChild(a.el)
    });
    b.appendChild(d);
    b.appendChild(e);
    c = setInterval(function () {
        f += EvRoulette.IMAGE_LOAD_INTERVAL;
        if (g === EvRoulette.N_WEAPONS || f >= EvRoulette.IMAGE_LOAD_WAIT_MSECS) clearInterval(c), a.el_weapons = e, a.el = b, a.el_parent.appendChild(a.el), a.spin()
    }, EvRoulette.IMAGE_LOAD_INTERVAL)
};
EvRoulette.prototype.make_sound = function (a) {
    if (!this.silent_mode && !isSafari) {
        try {
            a = new Audio(a);
            a.volume = 0.1;
            a.play({
                onplay: function () {},
                onerror: function (errorCode, description) {}
            });
        } catch (err) {}
    }
};
EvRoulette.prototype.play_sound_spin = function () {
    if (!this.silent_mode && !isSafari) {
        EvRoulette.sound_spin_object.currentTime = 0;
        EvRoulette.sound_spin_object.play();
    }
};
EvRoulette.prototype.spin = function () {
    var a = this,
        b = Math.floor(EvWeapon.EL_WIDTH / 2),
        d = Math.floor(EvWeapon.EL_WIDTH / 20),
        pos = (Math.floor(Math.random() * (18 * d - d + 1)) + d),
        g, f = 0;
    if (typeof a.position !== 'undefined') {
        if (a.position != null) {
            pos = a.position;
        }
    }
    var e = (EvRoulette.N_WEAPONS - 8) * EvWeapon.EL_WIDTH + b + pos;
    a.el_weapons.style.transition = "left " + EvRoulette.SPIN_SECS + "s ease-out";
    setTimeout(function () {
        a.beforeparty();
        a.make_sound(EvRoulette.SOUND_START);
        a.el_weapons.style.left = "-" + e + "px";
        g = setInterval(function () {
            var c = Math.abs(parseInt(window.getComputedStyle(a.el_weapons).left, 10)),
                c = Math.floor((c + b) / EvWeapon.EL_WIDTH);
            c > f && (f = c, a.play_sound_spin())
        }, EvRoulette.SOUND_SPIN_INTERVAL)
    }, EvRoulette.START_DELAY_MSECS);
    a.el_weapons.addEventListener("transitionend", function () {
        clearInterval(g);
        a.make_sound(EvRoulette.SOUND_STOP);
        a.weapons.forEach(function (a) {
            a.id !== EvRoulette.WEAPON_PRIZE_ID && (a.el.style.opacity = .5)
        });
        a.afterparty();
    });
    a.finish = function () {
        a.el_weapons.style.transition = 'none';
        a.el_weapons.style.transition = "left 400ms ease-out";
        a.el_weapons.style.left = "-" + (e + 1) + "px";
    };
};
EvRoulette.prototype.start = function () {
    this.set_weapons();
    this.render();
};
(function ($) {
    var Roulette = function (options) {
        var defaultSettings = {
            maxPlayCount: null,
            speed: 10,
            stopImageNumber: null,
            rollCount: 3,
            duration: 3,
            timing_func: 'ease-out',
            moveUp: false,
            isRunUp: true,
            cache: {},
            stopCallback: function () {},
            startCallback: function () {},
        }
        var defaultProperty = {
            playCount: 0,
            $rouletteTarget: null,
            imageCount: null,
            $images: null,
            originalStopImageNumber: null,
            totalHeight: null,
            maxDistance: null,
            slowDownStartDistance: null,
            isReady: false,
            isRandom: false,
            isSlowdown: false,
            isStop: false,
            distance: 0,
            runUpDistance: null,
            slowdownTimer: null,
            isIE: navigator.userAgent.toLowerCase().indexOf('msie') > -1
        };
        var p = $.extend({}, defaultSettings, options, defaultProperty);
        var reset = function () {
            p.maxDistance = defaultProperty.maxDistance;
            p.slowDownStartDistance = defaultProperty.slowDownStartDistance;
            p.distance = defaultProperty.distance;
            p.isStop = defaultProperty.isStop;
            p.isReady = defaultProperty.isStop;
            p.timing_func = defaultProperty.timing_func;
        }
        var init = function ($roulette) {
            var rollkey = $roulette.attr('id') + $roulette.attr('class');
            if (p.cache[rollkey] == null) {
                p.cache[rollkey] = $roulette.html();
                p.isRandom = $.isNumeric(p.stopImageNumber) && Number(p.stopImageNumber) >= 0 ? false : true;
            } else {
                $roulette.html(p.cache[rollkey]);
                p.$images = false;
            }
            $roulette.css({
                'overflow': 'hidden'
            });
            if (p.isRandom == false) {
                defaultProperty.originalStopImageNumber = p.stopImageNumber;
            }
            if (!p.$images) {
                p.$images = $roulette.find('>').remove();
                p.imageCount = p.$images.length;
                p.stopImageNumber = $.isNumeric(defaultProperty.originalStopImageNumber) && Number(defaultProperty.originalStopImageNumber) >= 0 ? Number(defaultProperty.originalStopImageNumber) : Math.floor(Math.random() * p.imageCount);
                if (p.$images.eq(0).find('img').length > 0) {
                    p.$images.eq(0).find('img').bind('load', function () {
                        p.imageHeight = p.$images.eq(0).height();
                        $roulette.css({
                            'height': (p.imageHeight + 'px')
                        });
                        p.totalHeight = p.imageCount * p.imageHeight * (p.rollCount + 1);
                        p.runUpDistance = 2 * p.imageHeight;
                        fill_cells($roulette);
                    });
                    p.$images.find('img').each(function () {
                        if (this.complete || this.complete === undefined) {
                            var src = this.src;
                            this.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
                            this.src = src;
                        }
                    });
                } else {
                    p.$images.eq(0).bind('load', function () {
                        p.imageHeight = $(this).height();
                        $roulette.css({
                            'height': (p.imageHeight + 'px')
                        });
                        p.totalHeight = p.imageCount * p.imageHeight * (p.rollCount + 1);
                        p.runUpDistance = 2 * p.imageHeight;
                        fill_cells($roulette);
                    }).each(function () {
                        if (this.complete || this.complete === undefined) {
                            var src = this.src;
                            this.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
                            this.src = src;
                        }
                    });
                }
            }
            $roulette.find('div').remove();
            p.$images.css({
                'display': 'block'
            });
            p.$rouletteTarget = $('<div>').css({
                'position': 'relative',
                'top': '0',
                'transition-property': 'all',
                'transition-delay': '0s',
                'transition-duration': p.duration + 'ms',
                'transition-timing-function': p.timing_func,
            }).attr('class', "rollme-inner");
            $roulette.append(p.$rouletteTarget);
            p.$rouletteTarget.append(p.$images);
            p.$roulette = $roulette;
        }
        var fill_cells = function ($roulette) {
            var rollkey = $roulette.attr('id') + $roulette.attr('class');
            for (let a = 0; a < p.rollCount; a++) {
                for (let b = 0; b < p.imageCount; b++) {
                    p.$rouletteTarget.append(p.$images.eq(b).clone());
                }
            }
            if (p.isRunUp) {
                p.$rouletteTarget.append(p.$images.eq(p.stopImageNumber).clone());
                p.$rouletteTarget.append(p.$images.eq(0).clone());
            } else {
                p.$rouletteTarget.append(p.$images.eq(0).clone());
                p.$rouletteTarget.prepend(p.$images.eq(p.stopImageNumber).clone());
            }
            if (p.isRunUp) {
                p.$rouletteTarget.css({
                    'transition-duration': '0ms',
                    'top': '0px',
                });
            } else {
                p.$rouletteTarget.css({
                    'transition-duration': '0ms',
                    'top': '-' + (p.totalHeight + p.imageHeight) + 'px',
                });
            }
            $roulette.show();
            p.isReady = true;
            if (p.playCount > 1) {
                _roll_trans();
            }
        }
        var roll_trans = function () {
            if (p.playCount > 1) {
                init(p.$roulette);
            }
            if (p.isReady) {
                _roll_trans();
            }
        }
        var _roll_trans = function () {
            if (p.isRunUp) {
                p.$rouletteTarget.css({
                    'transition-duration': '0ms',
                    'top': '0px',
                });
            } else {
                p.$rouletteTarget.css({
                    'transition-duration': '0ms',
                    'top': '-' + (p.totalHeight + p.imageHeight) + 'px',
                });
            }
            setTimeout(function () {
                if (p.isRunUp) {
                    p.$rouletteTarget.css({
                        'transition-duration': p.duration + 'ms',
                    }).css('top', '-' + p.totalHeight + 'px');
                } else {
                    p.$rouletteTarget.css({
                        'transition-duration': p.duration + 'ms',
                    }).css('top', '0px');
                }
            }, 300);
            p.$rouletteTarget.one('transitionend', function () {
                p.stopCallback(p.$rouletteTarget.find('img').eq(p.stopImageNumber), p.stopImageNumber);
                return;
            });
        }
        var start = function () {
            p.playCount++;
            if (p.maxPlayCount && p.playCount > p.maxPlayCount) {
                return;
            }
            p.stopImageNumber = $.isNumeric(defaultProperty.originalStopImageNumber) && Number(defaultProperty.originalStopImageNumber) >= 0 ? Number(defaultProperty.originalStopImageNumber) : Math.floor(Math.random() * p.imageCount);
            p.startCallback();
            setTimeout(function () {
                roll_trans();
            }, 200);
        }
        var stop = function (option) {
            if (!p.isSlowdown) {
                p.$rouletteTarget.css({
                    'transition-duration': '10ms',
                });
            }
        }
        var option = function (options) {
            p = $.extend(p, options);
            p.speed = Number(p.speed);
            p.duration = Number(p.duration);
            p.duration = p.duration > 1 ? p.duration - 1 : 1;
            defaultProperty.originalStopImageNumber = options.stopImageNumber;
        }
        var ret = {
            start: start,
            stop: stop,
            init: init,
            option: option
        }
        return ret;
    }
    var pluginName = 'roulette';
    $.fn[pluginName] = function (method, options) {
        return this.each(function () {
            var self = $(this);
            var roulette = self.data('plugin_' + pluginName);
            if (roulette && roulette[method]) {
                if (roulette[method]) {
                    roulette[method](options);
                } else {
                    console && console.error('Method ' + method + ' does not exist on jQuery.roulette');
                }
            } else {
                roulette = new Roulette(method);
                roulette.init(self, method);
                $(this).data('plugin_' + pluginName, roulette);
            }
        });
    }
})(jQuery);
var diff = function (items, a) {
    return items.filter(function (i) {
        return a.indexOf(i) < 0;
    });
};

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

function dynamicSort(property, direction) {
    var sortOrder = 1;
    if (direction == true) {
        sortOrder = -1;
    }
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function dynamicSortNumber(property, direction) {
    var sortOrder = 1;
    if (direction == true) {
        sortOrder = -1;
    }
    return function (a, b) {
        var result = (Number(a[property]) < Number(b[property])) ? -1 : (Number(a[property]) > Number(b[property])) ? 1 : 0;
        return result * sortOrder;
    }
}
if ($('.casebattle-games-list').length) {
    run_casebattle();
    window.addEventListener('popstate', function (e) {
        var state = e.state;
        if (state !== null) {
            run_casebattle();
            if (typeof (socket_casebattle) != 'undefined') {
                socket_casebattle.emit('auth', user.id, function (data) {
                    console.log('Casebattle authed: ' + data.toString())
                });
            }
        }
    });
}

function run_casebattle() {
    pjax_fix('#casebattle');
    var Casebattle = new Vue({
        el: '#casebattle',
        data: {
            modal_showed: false,
            battle_id: null,
            debug: true,
            games_is_loaded: false,
            is_private: false,
            show_smiles: false,
            config: config,
            cases_list: {},
            cases: [],
            games: [],
            history: [],
            games_count: [],
            my_active_games: [],
            history_personal: [],
            total_sum_cases_on_modal: 0,
            total_cases_on_modal: 0,
            game: {
                battle_id: null,
                current_round: 1,
                price: 0,
                user_win_id: 0,
                win_price: 0,
                cases: [],
                players: [],
                items_swarm: [],
                is_start: false,
                is_finish: false,
                round: {},
                win_items: [],
                is_complete: false
            },
            stat: {
                active: 0,
                total: 0,
                last_hour: 0,
                last_day: 0,
                you_win: 0,
                online: 0
            },
            balance: 0,
            user_battle_sum: 0,
            max_items: 10,
            players_required: 1,
            timers: {
                next_round_time: 600,
                wait_users: 2000,
                timer_count: 0
            },
            lang: config.lang,
            user: user,
            balance_real: null,
            localization: localization,
            cb_path: '/' + config.lang + '/casebattle/',
            view: 'index',
            sub_view: 'active',
            game_view: 'active',
            view_game_state: '',
            is_loading: true,
            is_started: false,
            first_load_games: true,
            all_cases_id: [],
            active_games_ids: [],
            sort_by: 'count',
            is_desc: true,
            symbol: config.CURRENCY_SYMBOL,
            limit_case_count: config.CASEBATTLE_LIMIT_CASE_COUNT,
            limit_limit_rounds: config.CASEBATTLE_LIMIT_ROUNDS,
            new_game_rounds: [],
            new_game_rounds_stack: {},
            top_games: [],
            my_games: [],
            private_games: [],
            players_number: 2,
            case_list_sort_price_desc: false,
            current_case: {},
            times: {
                wait_other_users: 4,
                next_round: 1000,
                counter: 0,
                timer: null
            },
            smile_stack: [],
            send_smile_lock: false,
            sort_table: false,
            sort_table_direction: {
                'rounds': false,
                'value': false,
                'players': false
            },
            my_games_caselist: '',
            top_games_caselist: '',
            cashback_settings: {
                min: 0,
                percent: 0,
                multiplayer: {
                    "2": 0,
                    "3": 0,
                    "4": 0
                },
                use_case_amount: true,
            }
        },
        computed: {
            main_games: function main_games() {
                var self = this;
                self.active_games_ids = [];
                self.games_count = [];
                return false;
            },
            statistics: function statistics() {
                var count = 0;
                if (this.games.length > 0) {
                    this.games.forEach(function (item) {
                        if (item.state === 'active') {
                            count++;
                        }
                    });
                }
                this.stat.active = count;
                return this.stat;
            },
            total_sum_win_modal: function () {
                var selected_items = this.game.win_items;
                var total = [];
                for (var i = 0, len = selected_items.length; i < len; i++) {
                    if (typeof (selected_items[i].steam_trade_offer_state) != 'undefined' && selected_items[i].steam_trade_offer_state != Hell.STEAM_TRADE_OFFER_STATE_NONE) {
                        continue;
                    }
                    total.push(selected_items[i].win_price);
                }
                var total_sum = total.reduce(function (total, num) {
                    return parseFloat(total) + parseFloat(num)
                }, 0).toFixed(2);
                return total_sum;
            },
            new_game_total_rounds: function () {
                var self = this;
                if (this.new_game_rounds.length === 0) return 0;
                var total_rounds = 0;
                this.new_game_rounds.filter(function (value) {
                    if (typeof (value.count) == 'number') {
                        total_rounds = total_rounds + parseInt(value.count);
                    }
                });
                return total_rounds;
            },
            cases_rounds: function () {
                var self = this;
                if (typeof (this.game.rounds) == 'undefined') return [];
                if (this.game.rounds.length == 0) return [];
                var round_number = 1;
                var cases = this.game.rounds.filter(function (c) {
                    if (round_number == c.round_number) {
                        round_number++;
                        return true;
                    }
                    return false;
                });
                return cases;
            },
            total_sum_cases_create_game: function () {
                if (this.new_game_rounds.length == 0) return 0;
                var self = this;
                var total = 0;
                this.new_game_rounds.filter(function (value) {
                    total = total + (parseFloat(value.case.price) * parseInt(value.count));
                });
                return total.toFixed(2);
            },
            active_battle_list: function () {
                var self = this;
                var games = JSON.parse(JSON.stringify(this.games));
                if (games === null) {
                    return [];
                }
                var games = games.filter(function (value) {
                    value.cases_list = [];
                    if (value.is_private == 1 && value.user_id != self.user.id) {
                        return false;
                    }
                    if (value.user_id == self.user.id) {
                        return false;
                    }
                    if (typeof (value.cases) === 'undefined' || value.cases == null) {
                        return false;
                    }
                    if (value.state === 'cancelled') {
                        return false;
                    }
                    if (typeof (value.cases) != 'string') {
                        for (var i = 0; i < value.cases.length; i++) {
                            if (typeof (value.cases[i]) === 'undefined') {
                                return value;
                            }
                            var x = self.cases_list[value.cases[i].case_id];
                            x.count = value.cases[i].count;
                            value.cases_list.push(x);
                        }
                        return value;
                    }
                    var cases = JSON.parse(value.cases);
                    var last_case_id = 0;
                    for (var i = 0; i < cases.length; i++) {
                        if (last_case_id !== cases[i]) {
                            if (typeof (self.cases_list[cases[i]]) == 'undefined') {
                                return false;
                            }
                            try {
                                var x = JSON.parse(JSON.stringify(self.cases_list[cases[i]]));
                            } catch (e) {
                                return false;
                            }
                            if (typeof (x) == 'undefined') {
                                continue;
                            }
                            x.count = 1;
                            value.cases_list.push(x);
                            last_case_id = cases[i];
                        } else {
                            value.cases_list[value.cases_list.length - 1].count += 1;
                        }
                    }
                    return value;
                });
                games.sort(dynamicSort('battle_id', true));
                return games;
            },
            private_battle_list: function () {
                var self = this;
                var games = JSON.parse(JSON.stringify(this.private_games));
                games = games.filter(function (value) {
                    value.cases_list = [];
                    if (typeof (value.cases) === 'undefined' || value.cases == null) {
                        return false;
                    }
                    if (value.state === 'cancelled') {
                        console.log('state: cancelled');
                        return false;
                    }
                    if (typeof (value.cases) != 'string') {
                        for (var i = 0; i < value.cases.length; i++) {
                            if (typeof (value.cases[i]) === 'undefined') {
                                return value;
                            }
                            var x = self.cases_list[value.cases[i].case_id];
                            x.count = value.cases[i].count;
                            value.cases_list.push(x);
                        }
                        return value;
                    }
                    var cases = JSON.parse(value.cases);
                    var last_case_id = 0;
                    for (var i = 0; i < cases.length; i++) {
                        if (last_case_id !== cases[i]) {
                            if (typeof (self.cases_list[cases[i]]) == 'undefined') {
                                return false;
                            }
                            try {
                                var x = JSON.parse(JSON.stringify(self.cases_list[cases[i]]));
                            } catch (e) {
                                return false;
                            }
                            if (typeof (x) == 'undefined') {
                                continue;
                            }
                            x.count = 1;
                            value.cases_list.push(x);
                            last_case_id = cases[i];
                        } else {
                            value.cases_list[value.cases_list.length - 1].count += 1;
                        }
                    }
                    return value;
                });
                games.sort(dynamicSort('battle_id', true));
                return games;
            },
            all_battle_list: function () {
                var self = this;
                var games = JSON.parse(JSON.stringify(this.games));
                if (games === null) {
                    return [];
                }
                var games = games.filter(function (value) {
                    value.cases_list = [];
                    if (value.is_private == 1 && value.user_id != self.user.id) {
                        return false;
                    }
                    if (typeof (value.cases) === 'undefined' || value.cases == null) {
                        return false;
                    }
                    if (value.state === 'cancelled') {
                        return false;
                    }
                    if (typeof (value.cases_string) == 'string') {
                        value.cases = value.cases_string;
                    }
                    if (typeof (value.cases) != 'string') {
                        for (var i = 0; i < value.cases.length; i++) {
                            if (typeof (value.cases[i]) === 'undefined') {
                                return value;
                            }
                            var x = self.cases_list[value.cases[i].case_id];
                            x.count = value.cases[i].count;
                            value.cases_list.push(x);
                        }
                        return value;
                    }
                    var cases = JSON.parse(value.cases);
                    var last_case_id = 0;
                    for (var i = 0; i < cases.length; i++) {
                        if (last_case_id !== cases[i]) {
                            if (typeof (self.cases_list[cases[i]]) == 'undefined') {
                                return false;
                            }
                            try {
                                var x = JSON.parse(JSON.stringify(self.cases_list[cases[i]]));
                            } catch (e) {
                                return false;
                            }
                            if (typeof (x) == 'undefined') {
                                continue;
                            }
                            x.count = 1;
                            value.cases_list.push(x);
                            last_case_id = cases[i];
                        } else {
                            value.cases_list[value.cases_list.length - 1].count += 1;
                        }
                    }
                    return value;
                });
                games.sort(dynamicSort('battle_id', true));
                games.sort(function (a, b) {
                    return a.user_id == self.user.id ? -1 : 1;
                });
                if (self.sort_table) {
                    if (self.sort_table == 'rounds') {
                        games.sort(dynamicSortNumber('round_count', self.sort_table_direction[self.sort_table]));
                        self.sort_table_direction[self.sort_table] = !self.sort_table_direction[self.sort_table];
                        self.sort_table = false;
                    }
                    if (self.sort_table == 'value') {
                        games.sort(dynamicSort('price', self.sort_table_direction[self.sort_table]));
                        self.sort_table_direction[self.sort_table] = !self.sort_table_direction[self.sort_table];
                        self.sort_table = false;
                    }
                    if (self.sort_table == 'players') {
                        games.sort(dynamicSort('players', self.sort_table_direction[self.sort_table]));
                        self.sort_table_direction[self.sort_table] = !self.sort_table_direction[self.sort_table];
                        self.sort_table = false;
                    }
                }
                return games;
            },
            my_active_battle_list: function () {
                var self = this;
                var games = JSON.parse(JSON.stringify(this.games));
                var games = games.filter(function (value) {
                    value.cases_list = [];
                    if (value.user_id !== self.user.id) {
                        return false;
                    }
                    if (typeof (value.cases) === 'undefined' || value.cases == null) {
                        return false;
                    }
                    if (value.state === 'cancelled') {
                        console.log('state: cancelled');
                        return false;
                    }
                    if (typeof (value.cases) != 'string') {
                        for (var i = 0; i < value.cases.length; i++) {
                            if (typeof (value.cases[i]) === 'undefined') {
                                return value;
                            }
                            var x = self.cases_list[value.cases[i].case_id];
                            x.count = value.cases[i].count;
                            value.cases_list.push(x);
                        }
                        return value;
                    }
                    var cases = JSON.parse(value.cases);
                    var last_case_id = 0;
                    for (var i = 0; i < cases.length; i++) {
                        if (last_case_id !== cases[i]) {
                            if (typeof (self.cases_list[cases[i]]) == 'undefined') {
                                return false;
                            }
                            try {
                                var x = JSON.parse(JSON.stringify(self.cases_list[cases[i]]));
                            } catch (e) {
                                return false;
                            }
                            if (typeof (x) == 'undefined') {
                                continue;
                            }
                            x.count = 1;
                            value.cases_list.push(x);
                            last_case_id = cases[i];
                        } else {
                            value.cases_list[value.cases_list.length - 1].count += 1;
                        }
                    }
                    return value;
                });
                games.sort(dynamicSort('battle_id', true));
                return games;
            },
            balance_left: function () {
                if (this.user_battle_sum === null) return 0;
                var b = parseFloat(this.balance - this.user_battle_sum);
                if (b < 0) return 0.00;
                return b.toFixed(2);
            },
            total_user_battle_sum: function () {
                if (this.user_battle_sum === null) return 0;
                var b = parseFloat(this.user_battle_sum);
                if (b < 0) return 0.00;
                return b.toFixed(2);
            },
            top_games_list: function () {
                var self = this;
                var games = this.top_games.filter(function (value) {
                    value.cases_list = [];
                    if (typeof (value.cases) == 'undefined' || value.cases == null) {
                        self.console('INVALID GAME, SKIP');
                        self.console(value);
                        return false;
                    }
                    if (typeof (value.cases) != 'string') {
                        for (var i = 0; i < value.cases.length; i++) {
                            if (typeof (value.cases[i]) == 'undefined') {
                                self.console(value);
                                return value;
                            }
                            var x = self.cases_list[value.cases[i].case_id];
                            x.count = value.cases[i].count;
                            value.cases_list.push(x);
                        }
                        return value;
                    }
                    var cases = JSON.parse(value.cases);
                    var last_case_id = 0;
                    for (var i = 0; i < cases.length; i++) {
                        if (last_case_id !== cases[i]) {
                            var x = self.cases_list[cases[i]];
                            if (typeof (x) == 'undefined') {
                                continue;
                            }
                            x.count = 1;
                            value.cases_list.push(x);
                            last_case_id = cases[i];
                        } else {
                            value.cases_list[value.cases_list.length - 1].count += 1;
                        }
                    }
                    return value;
                });
                return games;
            },
            my_games_list: function () {
                var self = this;
                if (this.my_games.length === 0) {
                    return [];
                }
                var games = this.my_games.filter(function (value) {
                    value.cases_list = [];
                    if (typeof (value.cases) == 'undefined' || value.cases == null) {
                        self.console('INVALID GAME, SKIP');
                        self.console(value.id);
                        return false;
                    }
                    if (typeof (value.cases) != 'string') {
                        for (var i = 0; i < value.cases.length; i++) {
                            if (typeof (value.cases[i]) == 'undefined') {
                                self.console(value);
                                return value;
                            }
                            var x = self.cases_list[value.cases[i].case_id];
                            x.count = value.cases[i].count;
                            value.cases_list.push(x);
                        }
                        return value;
                    }
                    var cases = JSON.parse(value.cases);
                    var last_case_id = 0;
                    for (var i = 0; i < cases.length; i++) {
                        if (last_case_id !== cases[i]) {
                            var x = self.cases_list[cases[i]];
                            if (typeof (x) == 'undefined') {
                                continue;
                            }
                            x.count = 1;
                            value.cases_list.push(x);
                            last_case_id = cases[i];
                        } else {
                            value.cases_list[value.cases_list.length - 1].count += 1;
                        }
                    }
                    return value;
                }).sort(function (a, b) {
                    return a.time_updated < b.time_updated
                });
                return games;
            },
            is_can_join: function () {
                return !this.is_joined(this.game);
            },
            sorted_case_list: function () {
                this.cases.sort(dynamicSort('price', this.case_list_sort_price_desc));
                return this.cases;
            },
            current_game_items: function () {
                var self = this;
                var weapons = [];
                if (this.view === 'game' && typeof (this.game.rounds) === 'object') {
                    var round_data = this.game.rounds[(this.game.users.length * this.game.current_round) - this.game.users.length];
                    if (typeof (round_data) !== 'undefined') {
                        var case_data = this.game.cases[round_data.case_id];
                        if (typeof (case_data.case_items) === 'object') {
                            $.each(case_data.case_items, function (index, value) {
                                weapons.push(self.game.items_swarm[value]);
                            });
                        }
                    }
                }
                return weapons;
            },
            items_id_list: function () {
                var items = Array();
                if (this.view === 'game' && typeof (this.game.win_items) !== 'undefined') {
                    this.game.win_items.forEach(function (item) {
                        if (item.steam_trade_offer_state === "0") {
                            items.push(item.open_id);
                        }
                    });
                }
                return items;
            },
            cashback_percent: function () {
                if (this.players_number < 3) return parseFloat(this.cashback_settings.percent) * 100;
                if (typeof (this.cashback_settings.multiplayer) == 'undefined') return parseFloat(this.cashback_settings.percent) * 100;
                return ((this.cashback_settings.multiplayer[this.players_number] + parseFloat(this.cashback_settings.percent)) * 100);
            },
            cashback_sum: function () {
                var self = this;
                return this.new_game_rounds.reduce(function (sum, a) {
                    var cashback;
                    var base_cashback;
                    var multiplayer_cashback = 0;
                    if (self.cashback_settings.use_case_amount && a.case.casebattle_cashback_amount > 0) {
                        base_cashback = parseFloat(a.case.casebattle_cashback_amount);
                    } else {
                        base_cashback = Math.round(a.case.price * self.cashback_settings.percent * 100) / 100;
                    }
                    if (typeof (self.cashback_settings.multiplayer[self.players_number]) !== 'undefined' && self.cashback_settings.multiplayer[self.players_number] > 0) {
                        multiplayer_cashback = self.cashback_settings.multiplayer[self.players_number] * a.case.price;
                        multiplayer_cashback = Math.round(multiplayer_cashback * 100) / 100;
                    }
                    cashback = base_cashback + multiplayer_cashback;
                    if (cashback < self.cashback_settings.min) {
                        cashback = self.cashback_settings.min;
                    }
                    var cash_sum = (parseFloat(sum) + Math.round(cashback * a.count * 100) / 100);
                    return cash_sum.toFixed(2);
                }, 0);
            },
        },
        filters: {
            total_win_sum: function (game) {
                return window.casebattle.calc_amount(parseFloat(game['open_id_1_win_price']) + parseFloat(game['open_id_2_win_price']));
            },
            sort_by_price: function (users) {
                users.sort(dynamicSort('final_price', true));
                return users;
            }
        },
        watch: {
            'game.current_round': function (val1, val2) {
                this.get_current_case();
            },
            'view': function (val1, val2) {
                Vue.nextTick(function () {
                    lazyLoad();
                });
            }
        },
        created: function created() {
            var self = this;
            this.get_cases();
        },
        updated: function () {
            Vue.nextTick(function () {
                $('.owl-carousel').owlCarousel({
                    loop: false,
                    margin: 0,
                    nav: false,
                    autoWidth: true,
                    items: 6
                });
            });
        },
        methods: {
            active_game_cashback: function (data) {
                var sum = 0;
                for (var i = 0; i < data.cases_list.length; i++) {
                    sum += Number(data.cases_list[i].casebattle_cashback_amount);
                }
                return sum.toFixed(2);
            },
            my_games_caselist_toogle: function (data) {
                var current = this.my_games_caselist;
                if (data == this.my_games_caselist) {
                    this.my_games_caselist = '';
                } else {
                    this.my_games_caselist = data;
                }
            },
            top_games_caselist_toogle: function (data) {
                var current = this.top_games_caselist;
                if (data == this.top_games_caselist) {
                    this.top_games_caselist = '';
                } else {
                    this.top_games_caselist = data;
                }
            },
            cases_round_next: function (round) {
                var self = this;
                if (typeof (this.game.rounds) == 'undefined') return [];
                var cases = this.game.rounds.filter(function (c) {
                    return c.user_id == self.game.user_id;
                });
                return cases.filter(function (c) {
                    return (parseInt(c.round_number) > round);
                });
            },
            create_game_cases_list: function () {
                var self = this;
                var cases = [];
                if (this.new_game_rounds.length == 0) return [];
                this.new_game_rounds.filter(function (value) {
                    for (var index = 0; index < value.count; index++) {
                        cases.push(value.case);
                    }
                });
                return cases;
            },
            get_case: function (case_id) {
                var case_data = {};
                if (this.is_loading === false && this.view === 'game' && typeof (this.game.rounds) === 'object') {
                    if (typeof (this.cases_list[case_id]) !== 'undefined') {
                        case_data = this.cases_list[case_id];
                    }
                }
                return case_data;
            },
            get_cases: function () {
                var self = this;
                if (typeof (case_list) != undefined && case_list != null) {
                    var data = case_list;
                    if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                        self.balance = data.balance;
                        self.cashback_settings = data.cashback_settings;
                        if (data.user_battle_sum !== null) {
                            self.user_battle_sum = data.user_battle_sum;
                        }
                        self.cases = data.cases;
                        $.each(data.cases, function (index, value) {
                            value.price = parseFloat(value.price);
                            self.cases_list[value.id] = value;
                            self.all_cases_id.push(parseInt(value.id));
                        });
                        Vue.nextTick(function () {
                            lazyLoad();
                        });
                        return true;
                    }
                }
                $.ajax({
                    url: this.cb_path + 'getcaselist',
                    type: 'GET',
                    dataType: 'json',
                    success: function success(data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.balance = data.balance;
                            self.cashback_settings = data.cashback_settings;
                            if (data.user_battle_sum !== null) {
                                self.user_battle_sum = data.user_battle_sum;
                            }
                            self.cases = data.cases;
                            $.each(data.cases, function (index, value) {
                                value.price = parseFloat(value.price);
                                self.cases_list[value.id] = value;
                                self.all_cases_id.push(parseInt(value.id));
                            });
                            Vue.nextTick(function () {
                                lazyLoad();
                            });
                        } else {
                            ShowMsg(localization.error, localization[data.error_message], 'error', 10000);
                        }
                    },
                    error: function error() {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 10000);
                    }
                });
            },
            recount_cases_on_modal: function () {
                var self = this;
                var total_sum = 0;
                var total_cases = 0;
                $.each(this.new_game_rounds_stack, function (index, value) {
                    total_sum = total_sum + parseFloat(value.price) * value.count;
                    total_cases = total_cases + value.count;
                });
                this.total_cases_on_modal = total_cases;
                this.total_sum_cases_on_modal = total_sum.toFixed(2);
                return total_sum.toFixed(2);
            },
            get_current_case: function () {
                var self = this;
                var case_data = {};
                if (this.is_loading === false && this.view === 'game' && typeof (this.game.rounds) === 'object') {
                    var round_data = this.game.rounds[(this.game.users.length * this.game.current_round) - this.game.users.length];
                    if (typeof (round_data) !== 'undefined') {
                        case_data = this.cases_list[round_data.case_id];
                    }
                }
                this.current_case = case_data;
                return case_data;
            },
            case_incr: function (i) {
                if (i.count >= this.limit_case_count) return false;
                if (i.new_game_total_rounds >= this.limit_limit_rounds) return false;
                i.count = i.count + 1;
                this.recount_cases_on_modal();
                return i.count;
            },
            case_decr: function (i) {
                if (i.count == 1) return false;
                i.count = i.count - 1;
                this.recount_cases_on_modal();
                return i.count;
            },
            case_remove: function (index) {
                delete this.new_game_rounds_stack[index];
                this.recount_cases_on_modal();
                this.sorted_case_list.sort();
            },
            remove_case: function (index) {
                this.new_game_rounds.splice(index, 1);
            },
            kick_user: function (battle, user) {
                console.log('kick_user');
                console.log(battle);
                console.log(user);
            },
            is_joined: function (game) {
                var self = this;
                var is_joined = false;
                if (parseInt(game.user_id) === parseInt(this.user.id)) {
                    return true;
                }
                if (typeof (game.users) == 'object') {
                    $.each(game.users, function (index, value) {
                        if (value.id == self.user.id) {
                            is_joined = true;
                        }
                    });
                }
                return is_joined;
            },
            calc_amount: function (price) {
                return currency_calc_amount(price);
            },
            copy_uid: function (text) {
                copyTextToClipboard(text);
                ShowMsg(localization.success, 'copied on buffer', 'success', 10000);
            },
            get_case_image: function (h) {
                if (typeof (h) !== 'undefined' && typeof (h.icon) !== 'undefined') {
                    return get_case_image(h)
                }
                return false;
            },
            get_case_image_weapon: function (h) {
                if (typeof (h) !== 'undefined' && typeof (h.icon) !== 'undefined') {
                    return get_case_image_weapon(h);
                }
                return false;
            },
            is_twin_case: function (category) {
                return is_twin_case(category);
            },
            timer: function (cb_interval, cb_finish, sec) {
                var self = this;
                if (self.times.counter > 1) return false;
                this.times.counter = sec;
                self.times.timer_id = setInterval(function () {
                    if (self.times.counter <= 1) {
                        clearInterval(self.times.timer_id);
                        cb_finish(self.times.counter);
                        return false;
                    }
                    self.times.counter = self.times.counter - 1;
                    cb_interval(self.times.counter);
                }, 1000);
            },
            number_format: function (x) {
                if (x == null) return 0;
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            },
            sort_battle: function (column) {
                this.sort_by = column;
                this.is_desc = !this.is_desc;
            },
            send_smile: function (smile_name) {
                if (this.send_smile_lock) {
                    return false;
                }
                if (this.battle_id == null) return false;
                var self = this;
                this.send_smile_lock = true;
                $.ajax({
                    url: this.cb_path + 'send_smile/' + this.battle_id,
                    type: 'POST',
                    data: {
                        smile: smile_name
                    },
                    dataType: 'json',
                    success: function success(data) {}
                });
                setTimeout(function () {
                    self.send_smile_lock = false;
                }, 3000);
            },
            show_smile: function (smile_data) {
                var self = this;
                self.smile_stack = self.smile_stack.filter(function (s) {
                    return htime_ago(s.time) < 3;
                });
                if (smile_data.battle_id == this.battle_id) {
                    this.$nextTick(function () {
                        smile_data.time = hget_time();
                        self.smile_stack.push(smile_data);
                    });
                    $('.send-smile img').one('transitionend', function () {
                        self.smile_stack = self.smile_stack.filter(function (s) {
                            return htime_ago(s.time) < 3;
                        });
                    });
                    setTimeout(function () {
                        self.smile_stack = self.smile_stack.filter(function (s) {
                            return htime_ago(s.time) < 3;
                        });
                    }, 5000);
                }
            },
            recount_my_games: function () {
                var self = this;
                self.my_active_games = [];
                if (typeof (self.games.map) != 'function') {
                    return false;
                }
                self.games.map(function (game) {
                    for (var index = 0; index < game.users.length; index++) {
                        if (game.users[index] == self.user.id) {
                            if (typeof (self.cases_list[game.case_id]) !== 'undefined') {
                                var game_case = self.cases_list[game.case_id];
                                game_case.game_id = game.ids[index];
                                self.my_active_games.push(game_case);
                            }
                        }
                    }
                });
            },
            show_stats: function show_stats(data) {
                if (data.casebattle !== undefined) {
                    this.stat.total = this.number_format(data.casebattle);
                }
                if (typeof data.online_casebattle != 'undefined') {
                    this.stat.online = this.number_format(data.online_casebattle);
                }
            },
            modal_show: function modal_show() {
                this.modal_showed = true;
            },
            modal_hide: function modal_hide() {
                this.modal_showed = false;
                this.new_game_rounds_stack = {};
            },
            set_finished_game: function () {
                var self = this;
                $.each(self.game.users, function (index, u) {
                    u.items = [];
                    u.final_price = 0;
                });
                this.game.current_round = this.game.round_count;
                this.get_current_case();
                this.game.win_items = [];
                $.each(self.game.rounds, function (index, item) {
                    $.each(self.game.users, function (index, u) {
                        if (typeof (u.items) == 'undefined') u.items = [];
                        if (parseInt(self.game.user_win_id) === parseInt(u.id)) {
                            u.items.push(item);
                            self.game.win_items.push(item);
                        }
                        if (parseInt(item.user_id) === parseInt(u.id)) {
                            u.final_price = parseFloat(u.final_price) + parseFloat(item.win_price);
                        }
                    });
                });
                this.game.is_finish = true;
                this.game.is_show_result = true;
                if (typeof (this.balance_real) != 'undefined' && this.balance_real != null && this.balance_real >= 0) {
                    updateBalance(this.balance_real);
                    this.balance_real = null;
                }
            },
            show_game: function show_game(battle_id, uid) {
                var self = this;
                if (this.battle_id === battle_id) return false;
                if (typeof (battle_id) == 'undefined' || battle_id == null) {
                    self.show_main_page();
                    return false;
                }
                self.console('show game' + battle_id);
                this.game = {
                    battle_id: battle_id,
                    current_round: 1,
                    price: 0,
                    user_win_id: 0,
                    win_price: 0,
                    cases: [],
                    players: 2,
                    items_swarm: [],
                    is_start: false,
                    is_finish: false,
                    is_show_result: false,
                    round: {},
                    win_items: [],
                    is_complete: false
                };
                this.battle_id = battle_id;
                this.view_game_state = '';
                this.is_loading = true;
                this.is_started = false;
                if (typeof (uid) != 'undefined') {
                    var post_data = {
                        uid: uid,
                        battle_id: battle_id
                    };
                } else {
                    var post_data = {
                        battle_id: battle_id
                    };
                }
                $.ajax({
                    url: this.cb_path + 'getgame/' + battle_id,
                    type: 'POST',
                    data: post_data,
                    dataType: 'json',
                    success: function success(data) {
                        self.is_loading = false;
                        if (data.state == 'cancelled') {
                            self.show_main_page();
                            ShowMsg(localization.error, 'game cancelled', 'error', 10000);
                            return false;
                        }
                        if (data.status === Hell.RESPONSE_STATUS_SUCCESS) {
                            self.console('show game inside ' + battle_id);
                            self.set_game_data(data);
                            if (data.cases_available == false && self.game.state !== 'finished') {
                                self.view = 'index';
                                self.is_loading = false;
                                ShowMsg(localization.error, 'cases not available!', 'error', 10000);
                                return false;
                            }
                            self.view = 'game';
                            self.get_current_case();
                            if (self.is_live(battle_id) || self.game.state == 'live') {
                                self.is_loading = true;
                                self.timer(function (index) {
                                    self.times.timer = index;
                                }, function () {
                                    self.console('start_game from show_game socket live');
                                    self.start_game();
                                }, self.times.wait_other_users);
                                return true;
                            }
                            if (self.game.users.length >= 2 && self.game.state !== 'finished') {
                                if (self.game.users.length === parseInt(self.game.players)) {
                                    self.is_loading = true;
                                    self.game.current_round = 1;
                                    self.fetch_images();
                                    self.timer(function (index) {
                                        self.times.timer = index;
                                    }, function () {
                                        self.console('start_game from show_game 2');
                                        self.start_game();
                                    }, self.times.wait_other_users);
                                }
                                return true;
                            }
                            if (self.game.state === 'finished') {
                                self.set_finished_game();
                            }
                        } else {
                            self.view = 'index';
                            self.is_loading = false;
                            ShowMsg(localization.error, localization[data.error_message], 'error', 10000);
                        }
                    },
                    error: function error() {
                        self.modal_showed = false;
                        self.is_loading = false;
                        ShowMsg(localization.error, localization.unknown_error, 'error', 10000);
                    }
                });
            },
            get_node_game: function (battle_id) {
                var game = this.games.filter(function (item) {
                    return (item.battle_id == battle_id)
                });
                if (game.length) {
                    return game[0];
                }
                return false;
            },
            is_live: function (battle_id) {
                var current_game = this.get_node_game(battle_id);
                if (current_game && current_game.state === 'live') {
                    return true;
                }
                return false;
            },
            recount_rounds_items_recount: function (round) {
                var self = this;
                if (parseInt(round) == 1) {
                    return false;
                }
                self.game.win_items = [];
                $.each(self.game.users, function (index, u) {
                    u.items = [];
                    u.final_price = 0;
                });
                $.each(this.game.rounds, function (idx, item) {
                    if (parseInt(item.round_number) >= parseInt(round)) {
                        return false;
                    }
                    $.each(self.game.users, function (index, u) {
                        if (typeof (u.items) == 'undefined') u.items = [];
                        if (parseInt(item.user_id) === parseInt(u.id)) {
                            u.items.push(item);
                            self.game.win_items.push(item);
                            u.final_price = parseFloat(u.final_price) + parseFloat(item.win_price);
                        }
                    });
                });
            },
            fast_join_game: function (battle_id) {
                var self = this;
                routie(battle_id);
                this.game = null;
                this.show_game(battle_id);
                this.join_game(battle_id);
            },
            join_game: function join_game(battle_id) {
                var self = this;
                self.console('Start ' + battle_id);
                self.console('Received -1  ' + battle_id);
                if (typeof (battle_id) == 'undefined' || battle_id == null) {
                    self.show_main_page();
                    return false;
                }
                this.is_loading = true;
                $.ajax({
                    url: this.cb_path + 'joingame/' + battle_id,
                    type: 'POST',
                    dataType: 'json',
                    success: function success(data) {
                        self.console('Received ' + battle_id);
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.console('Joining ' + battle_id);
                            updateBalance(data.balance);
                            var temp_game_id = data.battle_id;
                            self.battle_id = null;
                            self.balance = data.balance;
                            routie(battle_id);
                            self.game = null;
                            self.show_game(battle_id);
                            self.is_loading = false;
                        } else {
                            self.is_loading = false;
                            if (data.error_message == 'casebattle_allready_joined') {
                                routie(battle_id);
                                self.show_game(battle_id);
                                return true;
                            }
                            if (data.error_message == 'casebattle_players_full') {
                                routie(battle_id);
                                self.show_game(battle_id);
                                return true;
                            }
                            if (data.error_message == 'no_data') {
                                ShowMsg(localization.error, 'no_data', 'error', 10000);
                                self.show_main_page();
                                return true;
                            }
                            if (data.error_message == 'need_auth') {
                                ShowNeedAuthModal();
                            } else if (data.error_message == 'need_sum') {
                                ShowAddBalanceModal(data.sum);
                            } else {
                                if (data.error_message == 'casebattle_allready_joined') {
                                    ShowMsg(localization.error, localization[data.error_message], 'warn', 10000);
                                    if (self.view != 'index') {
                                        self.view = 'index';
                                    }
                                } else if (data.error_message == 'casebattle_no_access') {
                                    ShowSubscribeModal();
                                } else {
                                    ShowMsg(localization.error, localization[data.error_message], 'error', 10000);
                                }
                            }
                        }
                    },
                    error: function error(data) {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 10000);
                    }
                });
            },
            silent_join_game: function (battle) {
                var self = this;
                var battle_id = battle.battle_id;
                var total_need = battle.players - battle.users.length;
                if (total_need === 1) {
                    this.fast_join_game(battle_id);
                    return false;
                }
                if (typeof (battle_id) == 'undefined' || battle_id == null) {
                    return false;
                }
                this.is_loading = true;
                $.ajax({
                    url: this.cb_path + 'joingame/' + battle_id,
                    type: 'POST',
                    dataType: 'json',
                    success: function success(data) {
                        self.console('Received ' + battle_id);
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.console('Joining ' + battle_id);
                            updateBalance(data.balance);
                            var temp_game_id = data.battle_id;
                            self.battle_id = null;
                            self.balance = data.balance;
                            self.game = {};
                            self.is_loading = false;
                        } else {
                            self.is_loading = false;
                            if (data.error_message == 'casebattle_allready_joined') {
                                return true;
                            }
                            if (data.error_message == 'casebattle_players_full') {
                                return true;
                            }
                            if (data.error_message == 'no_data') {
                                ShowMsg(localization.error, 'no_data', 'error', 10000);
                                return true;
                            }
                            if (data.error_message == 'need_auth') {
                                ShowNeedAuthModal();
                            } else if (data.error_message == 'need_sum') {
                                ShowAddBalanceModal(data.sum);
                            } else {
                                if (data.error_message == 'casebattle_allready_joined') {
                                    ShowMsg(localization.error, localization[data.error_message], 'warn', 10000);
                                    if (self.view != 'index') {
                                        self.view = 'index';
                                    }
                                } else if (data.error_message == 'casebattle_no_access') {
                                    ShowSubscribeModal();
                                } else {
                                    ShowMsg(localization.error, localization[data.error_message], 'error', 10000);
                                }
                            }
                        }
                    },
                    error: function error(data) {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 10000);
                    }
                });
            },
            get_games: function get_games(games) {
                var self = this;
                self.games_is_loaded = true;
                self.games = games;
                if (this.view == 'game') {
                    var current_game = this.games.filter(function (item) {
                        return (item.battle_id == self.battle_id)
                    });
                    if (current_game.length > 0) {
                        if (current_game[0].state === 'live' && !self.game.is_finish) {}
                        if (current_game[0].state === 'active') {
                            if (typeof (this.game.users) == 'undefined' || typeof (this.game.users) == null || this.game.users.length != current_game[0].users.length) {
                                self.is_loading = false;
                                self.update_game(current_game[0]);
                            }
                        }
                    }
                } else {
                    Vue.nextTick(function () {
                        lazyLoad();
                    });
                }
            },
            human_date: function (history) {
                if (typeof (history.tmp_date) == 'undefined') history.tmp_date = history.date;
                var local = moment(moment.utc(history.tmp_date).toDate()).format('YYYY-MM-DD HH:mm:ss');
                history.date = moment(local).fromNowOrSeconds();
            },
            game_finished: function game_finished(data) {},
            get_history: function get_history(history) {
                this.history = history;
                for (var i in this.history) {
                    if (typeof (this.history[i]) == 'string') {
                        var history_item = JSON.parse(this.history[i]);
                    } else {
                        var history_item = this.history[i];
                    }
                    if (typeof (history_item.time_delay) !== null && typeof (history_item.time_delay) !== 'undefined' && history_item.time_delay !== null && history_item.time_delay >= 0) {
                        setTimeout(this.timeout_history, 1000 * Number(history_item.time_delay), history_item);
                    }
                    this.history[i] = history_item;
                }
            },
            add_to_history: function (history) {
                var self = this;
                if (history.time_delay > 0) {
                    setTimeout(function () {
                        if (self.history.length > 10) {
                            self.history.pop();
                        }
                        self.history.unshift(history);
                    }, 1000 * Number(history.time_delay));
                } else {
                    if (self.history.length > 10) {
                        self.history.pop();
                    }
                    self.history.unshift(history);
                }
            },
            timeout_history: function timeout_history(item) {
                console.log('Event fired ' + item.id);
                item.time_delay = 0;
            },
            my_battle: function my_battle() {
                var self = this;
                $.ajax({
                    url: this.cb_path + 'my_battle',
                    type: 'GET',
                    dataType: 'json',
                    success: function success(data) {
                        self.history_personal = data.history;
                        self.sub_view = 'my';
                    },
                    error: function error() {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 10000);
                    }
                });
            },
            update_game: function (game, is_full_data) {
                this.console('update_game: start');
                if (this.view !== 'game') {
                    return false;
                }
                if (this.is_loading && is_full_data == false) {
                    this.console('update_game: already loaded');
                    return false;
                }
                var self = this;
                if (this.battle_id === game.battle_id) {
                    if (game.state === 'cancelled') {
                        this.show_main_page();
                        return false;
                    }
                    if (typeof (is_full_data) !== 'undefined' && is_full_data === true && this.game.is_finish === false) {
                        self.set_game_data(game);
                        self.console('is_full_data');
                        if (self.game.users.length >= 2) {
                            if (self.game.users.length === parseInt(self.game.players)) {
                                self.console('fetch_images');
                                self.game.current_round = '';
                                self.is_loading = true;
                                self.fetch_images();
                                self.console('timer');
                                self.timer(function (index) {
                                    self.times.timer = index;
                                }, function () {
                                    self.console('start_game from update');
                                    self.start_game_with_data(game);
                                }, self.times.wait_other_users);
                            }
                        }
                        return true;
                    } else {
                        this.console('update_game: not full game');
                        self.is_loading = false;
                    }
                    if (parseInt(game.battle_id) === NaN) {
                        return false;
                    }
                    this.is_loading = true;
                    $.ajax({
                        url: this.cb_path + 'getgame/' + game.battle_id,
                        type: 'GET',
                        dataType: 'json',
                        success: function success(data) {
                            self.is_loading = false;
                            if (data.status === Hell.RESPONSE_STATUS_SUCCESS) {
                                self.set_game_data(data);
                                if (self.game.users.length >= 2) {}
                            } else {
                                self.view = 'index';
                                self.is_loading = false;
                                ShowMsg(localization.error, localization[data.error_message], 'error', 10000);
                            }
                        },
                        error: function error() {
                            self.modal_showed = false;
                            self.is_loading = false;
                            ShowMsg(localization.error, localization.unknown_error, 'error', 10000);
                        }
                    });
                }
            },
            set_game_data: function (data) {
                var self = this;
                self.battle_id = data.id;
                self.game.battle_id = data.id;
                self.game.is_run = false;
                self.game.id = data.id;
                self.game.state = data.state;
                self.game.price = data.price;
                self.game.uid = data.uid;
                self.game.round_count = parseInt(data.round_count);
                self.game.rounds = data.rounds;
                self.game.is_private = data.is_private;
                self.game.users = data.users;
                self.game.items_swarm = data.items_swarm;
                if (self.game.cases.length == 0) {
                    self.game.cases = data.cases;
                }
                self.game.win_price = data.win_price;
                self.game.cashback = data.cashback;
                self.game.user_win_id = data.user_win_id;
                self.game.user_id = data.user_id;
                self.game.players_current_count = data.players_current_count;
                self.game.players = parseInt(data.players);
                self.game.current_round = 1;
                self.players_required = 0;
                if (data.users.length < data.players) {
                    self.players_required = parseInt(data.players - data.users.length);
                }
                $.each(self.game.users, function (index, u) {
                    if (typeof (u.items) === 'undefined') {
                        u.items = [];
                        u.final_price = 0;
                    }
                });
            },
            create_new_from_current: function () {
                var self = this;
                var cases = [];
                var cases_object = {};
                var is_private = (this.is_private) ? 1 : 0;
                if (this.is_loading) return false;
                this.is_loading = true;
                this.game.rounds.filter(function (value) {
                    if (value.user_id === self.game.user_id) {
                        if (typeof (cases_object[value.case_id]) != 'undefined') {
                            cases_object[value.case_id] = cases_object[value.case_id] + 1;
                        } else {
                            cases_object[value.case_id] = 1;
                        }
                    }
                });
                $.each(cases_object, function (key, value) {
                    cases.push({
                        'case_id': key,
                        'count': value
                    });
                });
                $.ajax({
                    url: self.cb_path + 'create_rounds_game',
                    type: 'POST',
                    data: {
                        cases: JSON.stringify(cases),
                        players: this.game.players,
                        is_private: is_private
                    },
                    dataType: 'json',
                    success: function success(data) {
                        self.is_loading = false;
                        if (data.status === Hell.RESPONSE_STATUS_SUCCESS) {
                            updateBalance(data.balance);
                            self.balance = data.balance;
                            self.modal_showed = false;
                            ShowMsg(localization.success, 'Game created.', 'success', 2000);
                            self.$nextTick(function () {
                                routie(data.game_id);
                                location.hash = data.game_id;
                            });
                        } else {
                            if (data.error_message === 'need_auth') {
                                self.modal_showed = false;
                                ShowNeedAuthModal();
                            } else if (data.error_message === 'need_sum') {
                                self.modal_showed = false;
                                ShowAddBalanceModal(data.sum);
                            } else if (data.error_message === 'casebattle_no_access') {
                                self.modal_showed = false;
                                ShowSubscribeModal();
                            } else {
                                ShowMsg(localization.error, localization[data.error_message], 'error', 10000);
                            }
                        }
                    },
                    error: function error() {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 10000);
                        self.is_loading = false;
                    }
                });
            },
            is_available: function (case_id) {
                return this.cases_list[case_id]['available'] === '1';
            },
            create_game: function create_game() {
                var self = this;
                var cases = [];
                var is_private = (this.is_private) ? 1 : 0;
                if (this.new_game_rounds.length == 0) return false;
                if (this.is_loading) return false;
                this.is_loading = true;
                this.new_game_rounds.filter(function (value) {
                    cases.push({
                        'case_id': value.case_id,
                        'count': value.count
                    });
                });
                $.ajax({
                    url: self.cb_path + 'create_rounds_game',
                    type: 'POST',
                    data: {
                        cases: JSON.stringify(cases),
                        players: this.players_number,
                        is_private: is_private
                    },
                    dataType: 'json',
                    success: function success(data) {
                        if (data.status === Hell.RESPONSE_STATUS_SUCCESS) {
                            updateBalance(data.balance);
                            self.balance = data.balance;
                            routie(data.game_id);
                            ShowMsg(localization.success, 'Game created.', 'success', 2000);
                            self.is_loading = false;
                            self.user_battle_sum = parseFloat(self.user_battle_sum) + parseFloat(self.total_sum_cases_create_game);
                        } else {
                            self.is_loading = false;
                            if (data.error_message === 'need_auth') {
                                self.modal_showed = false;
                                ShowNeedAuthModal();
                            } else if (data.error_message === 'need_sum') {
                                self.modal_showed = false;
                                ShowAddBalanceModal(data.sum);
                            } else if (data.error_message === 'casebattle_no_access') {
                                self.modal_showed = false;
                                ShowSubscribeModal();
                            } else {
                                ShowMsg(localization.error, localization[data.error_message], 'error', 10000);
                            }
                        }
                    },
                    error: function error() {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 10000);
                        self.is_loading = false;
                    }
                });
            },
            play_round: function (round_id) {
                var self = this;
                this.game.is_start = true;
                this.game.is_finish = false;
                this.game.is_run = false;
                var stopIndex = 0;
                var rounds = {};
                var is_fetched = false;
                this.get_current_case();
                if (typeof (this.game.rounds) == 'undefined') return false;
                if (this.game.rounds.length == 0) return false;
                $.each(this.game.rounds, function (idx, r) {
                    if (typeof (r.round_number) == 'string') {
                        if (typeof (rounds[r.round_number]) == 'undefined') {
                            rounds[r.round_number] = [r];
                        } else {
                            rounds[r.round_number].push(r);
                        }
                    }
                });
                if (typeof (rounds[round_id]) === 'undefined') {
                    return false;
                }
                this.game.round = rounds[round_id];
                $.each(self.game.users, function (index, user) {
                    $('#roulette' + user.id).html('');
                });
                $.each(self.current_game_items, function (idx, item) {
                    if (idx >= self.max_items) {
                        return false;
                    }
                    stopIndex = idx;
                    $.each(self.game.users, function (index, user) {
                        if (Math.floor(Math.random() * 2) == 1) {
                            $('#roulette' + user.id).append('' +
                                '<div class="cell-item">\n' +
                                '<div class="cell-item-image">\n' +
                                '<img src="' + item.steam_image + '/360fx360f.png" alt="' + item.steam_market_hash_name + '"></div>\n' +
                                '<div class="cell-item-name"><span>' + item.item_name + '</span><span class="cell-item-exterior">' + item.steam_exterior + '</span></div>');
                        } else {
                            $('#roulette' + user.id).prepend('' +
                                '<div class="cell-item">\n' +
                                '<div class="cell-item-image">\n' +
                                '<img src="' + item.steam_image + '/360fx360f.png" alt="' + item.steam_market_hash_name + '"></div>\n' +
                                '<div class="cell-item-name"><span>' + item.item_name + '</span><span class="cell-item-exterior">' + item.steam_exterior + '</span></div>');
                        }
                    });
                });
                $.each(self.game.round, function (index, item) {
                    $('#roulette' + item.user_id).append('' +
                        '<div class="cell-item">\n' +
                        '<div class="cell-item-image">\n' +
                        '<img src="' + item.steam_image + '/360fx360f.png" alt="' + item.steam_market_hash_name + '"></div>\n' +
                        '<div class="cell-item-name"><span>' + item.steam_short_name + '</span><span class="cell-item-exterior">' + item.steam_exterior + '</span></div>');
                });
                stopIndex = stopIndex + 1;
                Vue.nextTick(function () {
                    var option = {
                        duration: 3000,
                        rollCount: 2,
                        stopImageNumber: stopIndex,
                        startCallback: function () {},
                        slowDownCallback: function () {},
                        stopCallback: function ($stopElm, stopIndex) {
                            if (self.game.is_run === true) {
                                $.each(self.game.round, function (index, item) {
                                    $.each(self.game.users, function (index, u) {
                                        if (parseInt(item.user_id) === parseInt(u.id)) {
                                            u.items.push(item);
                                            self.game.win_items.push(item);
                                            u.final_price = parseFloat(u.final_price) + parseFloat(item.win_price);
                                        }
                                    });
                                });
                                self.game.is_run = false;
                                setTimeout(function () {
                                    if (self.battle_id !== self.game.battle_id) {
                                        return false;
                                    }
                                    self.game.is_finish = true;
                                    if (parseInt(self.game.round_count) > parseInt(self.game.current_round)) {
                                        setTimeout(function () {
                                            if (self.debug) self.console(self.game.round_count + ' - ' + self.game.current_round);
                                            self.game.current_round = self.game.current_round + 1;
                                            self.play_round(self.game.current_round);
                                        }, self.times.next_round);
                                    } else {
                                        self.game.is_start = false;
                                        self.is_loading = false;
                                        setTimeout(function () {
                                            if (self.battle_id !== self.game.battle_id) {
                                                return false;
                                            }
                                            self.game.is_show_result = true;
                                            self.is_started = false;
                                            self.game.state = 'finished';
                                            var winners = self.check_once_winner();
                                            if (winners.length > 1) {
                                                self.show_random_fair_winner(winners);
                                            } else {
                                                self.set_finished_game();
                                                if (parseInt(self.game.user_win_id) !== parseInt(self.user.id)) {
                                                    self.show_game_over_modal();
                                                } else {
                                                    self.show_winner_modal();
                                                }
                                            }
                                        }, 2000);
                                    }
                                }, 500);
                            }
                        }
                    };
                    if (is_fetched) return false;
                    if (self.game.is_run) return false;
                    self.fetch_images(function () {
                        is_fetched = true;
                        $.each(self.game.round, function (index, value) {
                            var r = $('#roulette' + value.user_id).roulette(option);
                            self.game.is_run = true;
                            Vue.nextTick(function () {
                                r.roulette('start');
                            });
                        });
                    });
                });
            },
            cancel_battle: function () {
                var self = this;
                var battle_id = this.game.id;
                if (typeof (battle_id) !== 'undefined' && parseInt(battle_id) > 0) {
                    $.ajax({
                        url: self.cb_path + 'cancel_battle/' + battle_id,
                        type: 'GET',
                        dataType: 'json',
                        success: function success(data) {
                            self.show_main_page();
                        }
                    });
                } else {
                    self.show_main_page();
                }
            },
            try_again: function () {
                this.is_started = false;
                this.game.is_complete = false;
                self.console('try_again');
                this.start_game();
            },
            get_cashback: function (user_id) {
                if (typeof (this.game.cashback[user_id]) !== 'undefined') {
                    return this.game.cashback[user_id];
                }
                return 0;
            },
            start_game: function () {
                var self = this;
                if (this.game == null || typeof (this.game.id) == 'undefined') return false;
                var battle_id = this.game.id;
                if (this.battle_id != battle_id) return false;
                if (this.is_started) return false;
                if (this.game.is_complete) return false;
                var node_game = self.get_node_game(battle_id);
                this.is_loading = true;
                this.is_started = true;
                this.game.is_complete = true;
                this.sub_view = '';
                $.ajax({
                    url: self.cb_path + 'start_game/' + battle_id,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id: battle_id
                    },
                    success: function success(data) {
                        self.is_loading = false;
                        self.balance_real = data.balance;
                        if (data.error_message === 'need_sum' && typeof (data.new_data) != 'undefined' && data.new_data.state != 'finished') {
                            self.modal_showed = false;
                            self.show_main_page();
                            ShowMsg(localization.error, localization.casebattle_no_have, 'error', 10000);
                            ShowAddBalanceModal(data.sum);
                            return false;
                        }
                        if (data.error_message === 'need_sum' && typeof (data.new_data) != 'undefined') {
                            data = data.new_data;
                        }
                        if (data.error_message === 'casebattle_invalid_state' && typeof (data.new_data) != 'undefined') {
                            data = data.new_data;
                        }
                        if (data.state == 'cancelled') {
                            self.show_main_page();
                            ShowMsg(localization.error, 'Game is cancelled', 'error', 10000);
                            return false;
                        }
                        if (typeof (data.balance_no_cashback) !== 'undefined') {
                            updateBalance(data.balance_no_cashback);
                        }
                        if (data.state === 'finished' || data.state == 'live') {
                            self.game = {
                                is_complete: true,
                                current_round: 1,
                                price: 0,
                                user_win_id: 0,
                                win_price: 0,
                                cases: [],
                                players: [],
                                items_swarm: [],
                                is_start: false,
                                is_finish: false,
                                round: {},
                                win_items: [],
                                cashback: {}
                            };
                            self.set_game_data(data);
                            $.each(self.game.users, function (index, u) {
                                if (typeof (u.items) === 'undefined') {
                                    u.items = [];
                                    u.final_price = 0;
                                }
                            });
                            self.game.is_finish = false;
                            self.game.is_run = false;
                            self.game.is_show_result = false;
                            self.game.state = 'live';
                            self.fetch_images(function () {
                                self.play_round(self.game.current_round);
                            });
                        } else {
                            if (data.error_message === 'no_money_owner') {
                                ShowMsg(localization.error, 'Sorry, but not all users have enough balance to start battle.', 'error', 10000);
                                self.show_main_page();
                            }
                            if (data.error_message === 'no_money_user') {
                                ShowMsg(localization.error, 'Sorry, but not all users have enough balance to start battle.', 'error', 10000);
                            }
                        }
                    }
                });
            },
            start_game_with_data: function (data) {
                var self = this;
                if (this.game == null || typeof (this.game.id) == 'undefined') return false;
                var battle_id = this.game.id;
                if (this.battle_id != battle_id) return false;
                if (this.is_started) return false;
                if (this.game.is_complete) return false;
                this.is_loading = true;
                this.is_started = true;
                this.game.is_complete = true;
                this.sub_view = '';
                self.is_loading = false;
                self.balance_real = data.balance;
                if (data.error_message === 'need_sum' && typeof (data.new_data) != 'undefined' && data.new_data.state != 'finished') {
                    self.modal_showed = false;
                    self.show_main_page();
                    ShowMsg(localization.error, localization.casebattle_no_have, 'error', 10000);
                    ShowAddBalanceModal(data.sum);
                    return false;
                }
                if (data.error_message === 'need_sum' && typeof (data.new_data) != 'undefined') {
                    data = data.new_data;
                }
                if (data.error_message === 'casebattle_invalid_state' && typeof (data.new_data) != 'undefined') {
                    data = data.new_data;
                }
                if (typeof (data.balance_no_cashback) !== 'undefined') {
                    updateBalance(data.balance_no_cashback);
                }
                if (data.state === 'finished' || data.state == 'live') {
                    self.game = {
                        is_complete: true,
                        current_round: 1,
                        price: 0,
                        user_win_id: 0,
                        win_price: 0,
                        cases: [],
                        players: [],
                        items_swarm: [],
                        is_start: false,
                        is_finish: false,
                        round: {},
                        rounds: [],
                        win_items: [],
                        cashback: {}
                    };
                    self.set_game_data(data);
                    $.each(self.game.users, function (index, u) {
                        if (typeof (u.items) === 'undefined') {
                            u.items = [];
                            u.final_price = 0;
                        }
                    });
                    self.game.is_finish = false;
                    self.game.is_run = false;
                    self.game.is_show_result = false;
                    self.game.state = 'live';
                    self.fetch_images(function () {
                        self.play_round(self.game.current_round);
                    });
                } else {
                    if (data.error_message === 'no_money_owner') {
                        ShowMsg(localization.error, 'Sorry, but not all users have enough balance to start battle.', 'error', 10000);
                        self.show_main_page();
                    }
                    if (data.error_message === 'no_money_user') {
                        ShowMsg(localization.error, 'Sorry, but not all users have enough balance to start battle.', 'error', 10000);
                    }
                }
            },
            item_sell: function item_sell(item) {
                if (parseInt(item.steam_trade_offer_state) != Hell.STEAM_TRADE_OFFER_STATE_NONE) {
                    return false;
                }
                var self = this;
                $.ajax({
                    url: '/' + self.lang + '/profile/sell',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id: item.open_id
                    },
                    success: function success(data) {
                        if (data.status === Hell.RESPONSE_STATUS_SUCCESS) {
                            item.steam_trade_offer_state = Hell.STEAM_TRADE_OFFER_STATE_SOLD;
                            updateBalance(data.balance);
                            ShowMsg(localization.success, localization.is_sold, 'success', 3000);
                        } else {
                            ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                        }
                    },
                    error: function error() {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                });
            },
            sell_all: function () {
                var selected_items = this.game.win_items;
                var selled_items = [];
                var self = this;
                var total = [];
                var ids = [];
                for (var i = 0, len = selected_items.length; i < len; i++) {
                    if (typeof (selected_items[i].steam_trade_offer_state) != 'undefined' && selected_items[i].steam_trade_offer_state != Hell.STEAM_TRADE_OFFER_STATE_NONE) {
                        continue;
                    }
                    total.push(selected_items[i].win_price);
                    ids.push(selected_items[i].open_id);
                    selled_items.push(selected_items[i]);
                }
                var total_sum = total.reduce(function (total, num) {
                    return parseFloat(total) + parseFloat(num)
                }, 0).toFixed(2);
                ids = ids.join(",");
                if (total_sum == 0) return false;
                $.ajax({
                    url: '/' + config.lang + '/profile/sell_mass',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        ids: ids,
                        is_cashout: false,
                        sum: total_sum
                    },
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            updateBalance(data.balance);
                            self.show_main_page();
                            ShowMsg(localization.success, localization.is_sold, 'success', 3000);
                        } else {
                            ShowMsg(localization.error, localization.sell_error, 'error', 3000);
                        }
                    },
                    error: function () {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 3000);
                    }
                })
            },
            get_steam_image: function get_steam_image(str, w, h) {
                w = w || 384;
                h = h || 384;
                return str + '/' + w + 'fx' + h + 'f.png';
            },
            get_steam_images: function get_steam_images(items, w, h) {
                for (var i = 0; i < items.length; i++) {
                    items[i]['steam_image'] = this.get_steam_image(items[i]['steam_image'], w, h);
                }
                return items;
            },
            show_create_page: function (case_id, count) {
                this.new_game_rounds = [];
                this.new_game_rounds_stack = {};
                this.is_loading = false;
                this.game.current_round = 1;
                if (typeof (case_id) != 'undefined' && parseInt(case_id) > 0 && typeof (this.cases_list[case_id]) != 'undefined') {
                    this.add_case_to_round(this.cases_list[case_id], count);
                    this.make_cases_rounds();
                }
                this.view = 'create_page';
                this.$nextTick(function () {
                    bind_odometer();
                });
            },
            get_exterior: function (ex) {
                var arr = ex.match(/([A-Z])/g);
                if (arr == null || arr.length == 0) return '';
                return arr.join('');
            },
            show_winner_modal: function () {
                this.sub_view = 'winner';
                this.view = 'game';
            },
            close_winner_modal: function () {
                this.sub_view = '';
                this.view = 'game';
            },
            show_game_over_modal: function () {
                this.sub_view = 'game_over';
                this.view = 'game';
            },
            show_main_page: function () {
                this.view = 'index';
                this.sub_view = '';
                this.reset_game();
                this.is_started = false;
                this.is_loading = false;
                routie('');
                Vue.nextTick(function () {
                    lazyLoad();
                    $(".casebattle .caselist-item,.casebattle .caselist").scroll(function () {
                        lazyLoad();
                    });
                });
            },
            reset_game: function () {
                this.battle_id = null;
                this.game = {
                    current_round: 1,
                    price: 0,
                    user_win_id: 0,
                    win_price: 0,
                    cases: [],
                    players: [],
                    items_swarm: [],
                    is_start: false,
                    is_finish: false,
                    round: {},
                    win_items: []
                };
            },
            fetch_images: function (cb) {
                var self = this;
                var images_loaded = 0;
                var max_items = self.max_items;
                if (this.current_game_items.length < self.max_items) max_items = this.current_game_items.length - 1;
                $.each(this.current_game_items, function (idx, item) {
                    if (idx >= max_items) {
                        self.console('images_loaded break');
                        return false;
                    }
                    var img = new Image();
                    img.src = item.steam_image + '/360fx360f.png';
                    img.onload = function () {
                        images_loaded = images_loaded + 1;
                        if (images_loaded === max_items) {
                            if (typeof (cb) === 'function') {
                                cb();
                            }
                            self.console('images_loaded ' + images_loaded);
                            return false;
                        }
                    };
                });
            },
            show_my_games: function () {
                var self = this;
                this.battle_id = null;
                $.ajax({
                    url: this.cb_path + 'get_battle_history',
                    type: 'POST',
                    data: {
                        user_id: self.user.id
                    },
                    dataType: 'json',
                    success: function success(data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.view = 'my_games';
                            self.my_games = data.data;
                            self.private_games = data.private;
                            Vue.nextTick(function () {
                                lazyLoad();
                                $(".casebattle .caselist-item,.casebattle .caselist").scroll(function () {
                                    lazyLoad();
                                });
                            });
                        } else {
                            self.view = 'my_games';
                            self.my_games = [];
                            self.private_games = [];
                        }
                    },
                    error: function error() {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 10000);
                    }
                });
            },
            startFindWinner: function (winners, cb) {
                var self = this;
                setTimeout(function () {
                    self.timer.count_timer = self.timer.count_timer + 1;
                    $.each(self.game.users, function (index, u) {
                        $('#u' + u.id).removeClass('ready').removeClass('winner').removeClass('loose').addClass('ready');
                    });
                    $.each(winners, function (index, u) {
                        if (self.timer.last_user_id != u.id) {
                            self.timer.last_user_id = u.id;
                            $('#u' + u.id).removeClass('ready').removeClass('winner').removeClass('loose').addClass('winner');
                            return false;
                        }
                    });
                    if (self.timer.count_timer == 5) {
                        self.timer.timeer_speed = 300;
                    }
                    if (self.timer.count_timer == 10) {
                        self.timer.timeer_speed = 200;
                    }
                    if (self.timer.count_timer == 20) {
                        self.timer.timeer_speed = 100;
                    }
                    if (self.timer.count_timer <= 40) {
                        self.startFindWinner(winners, cb);
                    } else {
                        if (parseInt(self.timer.last_user_id) == parseInt(self.game.user_win_id)) {
                            setTimeout(function () {
                                cb();
                            }, 1000);
                        } else {
                            self.startFindWinner(winners, cb);
                        }
                    }
                }, this.timer.timeer_speed);
            },
            show_random_fair_winner: function (winners) {
                var self = this;
                this.game_view = 'result_wihout_winner';
                this.timer.count_timer = 0;
                this.timer.last_user_id = 0;
                this.timer.timeer_speed = 600;
                this.startFindWinner(winners, function () {
                    self.game_view = 'active';
                    self.set_finished_game();
                    if (parseInt(self.game.user_win_id) !== parseInt(self.user.id)) {
                        self.show_game_over_modal();
                    } else {
                        self.show_winner_modal();
                    }
                });
            },
            check_once_winner: function () {
                var more_winners = [];
                var last_max_price = 0;
                $.each(this.game.users, function (index, u) {
                    if (u.final_price > last_max_price) {
                        last_max_price = u.final_price;
                    }
                });
                $.each(this.game.users, function (index, u) {
                    if (u.final_price === last_max_price) {
                        more_winners.push(u);
                    }
                });
                return more_winners;
            },
            show_top_games: function () {
                var self = this;
                this.battle_id = null;
                $.ajax({
                    url: this.cb_path + 'get_battle_top',
                    type: 'GET',
                    dataType: 'json',
                    success: function success(data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.view = 'top_games';
                            self.top_games = data.data;
                            Vue.nextTick(function () {
                                lazyLoad();
                                $(".casebattle .caselist-item,.casebattle .caselist").scroll(function () {
                                    lazyLoad();
                                });
                            });
                        } else {
                            self.view = 'top_games';
                            self.top_games = [];
                        }
                    },
                    error: function error() {
                        ShowMsg(localization.error, localization.unknown_error, 'error', 10000);
                    }
                });
            },
            add_case_to_round: function (c, count) {
                if (typeof (count) != 'undefined' && count <= this.limit_case_count) {
                    Vue.set(c, 'count', count);
                } else {
                    Vue.set(c, 'count', 1);
                }
                this.new_game_rounds_stack[c.id] = c;
                this.sorted_case_list.sort();
                this.recount_cases_on_modal();
            },
            check_case_in_round: function (id) {
                return (parseInt(id) in this.new_game_rounds_stack);
            },
            remove_case_round: function (c) {
                var index = this.new_game_rounds_stack.indexOf(c.id);
                if (index > -1) {
                    this.new_game_rounds_stack.splice(index, 1);
                }
            },
            make_cases_rounds: function () {
                var self = this;
                var clist = [];
                $.each(this.new_game_rounds_stack, function (index, item) {
                    if (typeof (item) !== 'undefined') {
                        self.new_game_rounds.push({
                            count: item.count,
                            case_id: item.id,
                            case: item
                        });
                    }
                });
                this.new_game_rounds_stack = {};
                this.modal_hide();
            },
            console: function (text) {
                if (config.ENV === 'development') {
                    console.log(text);
                }
            }
        },
        components: {
            'cb-caselist': {
                template: '<div class="caselist">\n' +
                    '<div class="caselist-case" v-for="c in battle.cases_list">\n' +
                    '<span class="caselist-case-count" v-text="\'x\' + c.count"></span>\n' +
                    '<img :src="$root.get_case_image(c)" alt="">\n' +
                    '<div class="case-title" v-text="c.locale_name"></div>\n' +
                    '</div>\n' +
                    '</div>',
                props: ['battle'],
            },
            'cb-itemlist': {
                template: '<div class="caselist-item" v-for="c in items.rounds">\n' +
                    '<img :src="c.steam_image  + \'/360fx360f.png\'" :alt="c.steam_market_hash_name" :title="c.steam_market_hash_name">\n' +
                    '<div class="case-title" v-text="c.steam_market_hash_name"></div>\n' +
                    '</div>',
                props: ['items'],
            }
        }
    });
    window.casebattle = Casebattle;
    window.casebattle_games_cache = [];
    if (typeof (socket_casebattle) !== 'undefined') {
        var onevent = socket_casebattle.onevent;
        socket_casebattle.onevent = function (packet) {
            var args = packet.data || [];
            onevent.call(this, packet);
            packet.data = ["*"].concat(args);
            onevent.call(this, packet);
        };
        socket_casebattle.on("*", function (event, data) {
            if (event !== 'casebattle_stats' && event !== 'games') {}
        });
        socket_casebattle.on('start_game', function (data) {
            Casebattle.console('start_game from socket_casebattle');
            Casebattle.start_game(data);
        });
        socket_casebattle.on('games', function (data) {
            Casebattle.get_games(data);
        });
        socket_casebattle.on('history', function (data) {
            Casebattle.get_history(data);
        });
        socket_casebattle.on('game', function (data) {
            Casebattle.update_game(data, true);
            Casebattle.add_to_history(data);
        });
        socket_casebattle.on('history_personal', function (data) {
            Casebattle.get_history_personal(data);
        });
        socket_casebattle.on('game_finished', function (data) {
            Casebattle.game_finished(data);
        });
        socket_casebattle.on('casebattle_stats', function (data) {
            Casebattle.show_stats(data);
        });
        socket_casebattle.on('casebattle_kick_user', function (data) {
            Casebattle.kick_user(data);
        });
        socket_casebattle.on('casebattle_join_game', function (data) {
            Casebattle.update_game(data, true);
        });
        socket_casebattle.on('casebattle_rounds_update_game', function (data) {
            Casebattle.update_game(data);
        });
        socket_casebattle.on('casebattle_rounds_new_game', function (data) {
            Casebattle.update_game(data);
        });
        socket_casebattle.on('casebattle_smile', function (data) {
            Casebattle.show_smile(data);
        });
    }
    routie({
        'top': function () {
            Casebattle.show_top_games();
        },
        'my': function () {
            Casebattle.show_my_games();
        },
        'create': function () {
            Casebattle.show_create_page();
        },
        'create::case_id': function (case_id) {
            Casebattle.show_create_page(case_id);
        },
        'create::case_id/:count': function (case_id, count) {
            count = parseInt(count);
            Casebattle.show_create_page(case_id, count);
        },
        ':game_id/join': function (_game_id) {
            if (parseInt(_game_id) != _game_id) {
                return false;
            }
            var c_path = location.pathname.split('/')[2];
            if (c_path === 'casebattle') {
                Casebattle.fast_join_game(_game_id);
            }
            if (c_path === 'casebattlerounds') {
                Casebattle.fast_join_game(_game_id);
            }
        },
        ':game_id/:uid': function (_game_id, _uid) {
            if (parseInt(_game_id) != _game_id) {
                return false;
            }
            Casebattle.show_game(_game_id, _uid);
        },
        ':game_id': function (_game_id) {
            if (_game_id === 'top') {
                Casebattle.show_top_games();
                return false;
            }
            if (_game_id === 'my') {
                Casebattle.show_my_games();
                return false;
            }
            if (parseInt(_game_id) != _game_id) {
                return false;
            }
            var c_path = location.pathname.split('/')[2];
            if (c_path === 'casebattle') {
                Casebattle.show_game(_game_id);
            }
            if (c_path === 'casebattlerounds') {
                Casebattle.show_game(_game_id);
            }
        },
        '*': function _() {
            Casebattle.view = 'index';
        }
    });
}

function giveaway_app(active_giveaways) {
    if ($("#gw_app").length > 0) {
        window.giveaway = new Vue({
            el: "#gw_app",
            data: {
                history: {
                    history: [],
                    historyOwn: []
                },
                config: config,
                user: user,
                joined: {},
                need_refill: config.min_enter,
                giveaways: [],
                current_gw: null,
                lang: localization,
                status: "error"
            },
            created: function () {
                if (active_giveaways !== undefined) {
                    var giveaways = active_giveaways;
                } else {
                    var giveaways = window.active_giveaways;
                }
                if (typeof window.active_giveaways !== "undefined") {
                    this.joined = window.active_giveaways.joined;
                    this.giveaways = window.active_giveaways.giveaways;
                    this.set_timeout(this.giveaways);
                    return true;
                } else {
                    $("#gw_app").hide();
                }
                this.refrash_gw();
            },
            methods: {
                round_price: function (price) {
                    return currency_calc_amount(parseFloat(price));
                },
                get_item_name: function (steam_market_hash_name) {
                    var name = steam_market_hash_name.split('|');
                    return $.trim(name[0]);
                },
                get_item_type: function (steam_market_hash_name) {
                    var name = steam_market_hash_name.split('|');
                    return $.trim(name[1]);
                },
                set_timeout: function (giveaways) {
                    Vue.nextTick(function () {
                        $.each(giveaways, function (index, item) {
                            var local = moment(moment.utc(item.finish).toDate()).format('YYYY-MM-DD HH:mm:ss');
                            $("#timer" + item.id).countdown(local, function (event) {
                                var format = "%H:%M:%S";
                                if (item.type == "hour") {
                                    format = "<span>%M</span> min <span>%S</span> sec";
                                    if (event.offset.totalHours > 0) {
                                        format = "<span>%H</span> hr <span>%M</span> min";
                                    }
                                }
                                if (item.type == "day") {
                                    format = "<span>%H</span> hr <span>%M</span> min";
                                }
                                if (item.type == "week") {
                                    format = "<span>%M</span> min <span>%S</span> sec";
                                    if (event.offset.totalHours > 0) {
                                        format = "<span>%H</span> hr <span>%M</span> min";
                                    }
                                    if (event.offset.totalDays > 0) {
                                        format = "<span>%-d</span> day%!d";
                                    }
                                }
                                $(this).html(event.strftime(format));
                            });
                        });
                    });
                },
                refrash_gw: function () {
                    var self = this;
                    $.getJSON("/" + config.lang + "/giveaway/active_giveaways", function (data) {
                        if (typeof data != "object" || data == null) {
                            return false;
                        }
                        self.joined = data.joined;
                        self.giveaways = data.giveaways;
                        self.set_timeout(data.giveaways);
                    });
                },
                sell: function (item_id) {
                    var self = this;
                    $.ajax({
                        url: "/" + self.config.lang + "/profile/sell",
                        type: "POST",
                        dataType: "json",
                        data: {
                            id: item_id
                        },
                        success: function (data) {
                            if (data.status == "success") {
                                if (data.status == "success") {
                                    updateBalance(data.balance);
                                    ShowMsg(localization.success, localization.is_sold, "success", 10000);
                                    for (var i in self.history.historyOwn) {
                                        var curr = self.history.historyOwn[i];
                                        if (curr.id == item_id) {
                                            curr.steam_trade_offer_state = 15;
                                            curr.state = localization.item_state_15;
                                            break;
                                        }
                                    }
                                } else {
                                    ShowMsg(localization.error, localization.sell_error, "fail", 3000);
                                }
                            } else {
                                ShowMsg(localization.error, localization.sell_error, "fail", 3000);
                            }
                        },
                        error: function () {
                            ShowMsg(localization.error, localization.unknown_error, "fail", 3000);
                        }
                    });
                },
                send: function ($item) {
                    var self = this;
                    $item.steam_trade_offer_state = 1;
                    $item.state = localization.item_state_9;
                    $.ajax({
                        url: "/" + self.config.lang + "/giveaway/send",
                        dataType: "json",
                        type: "POST",
                        data: {
                            id: $item.id
                        }
                    }).success(function (data) {
                        if (data.status == "success") {
                            ShowMsg(localization.success, localization.take_item, "success", 10000);
                            $item.steam_trade_offer_state = 2;
                            $item.state = localization.item_state_2;
                            $item.tradeofferlink = "https://steamcommunity.com/tradeoffer/" + data.tradeofferid;
                        } else {
                            if (data.type == "steam" && typeof data.error_message == "string") {
                                if (data.error_message.search("(15)") > 0) {
                                    ShowMsg(localization.error, localization["trade_error_15"], "fail", 10000);
                                } else {
                                    ShowMsg(localization.error, data.error_message, "fail", 10000);
                                }
                            } else {
                                ShowMsg(localization.error, localization[data.error_message], "fail", 10000);
                            }
                        }
                    });
                },
                open_history: function (gw, gw_id) {
                    var self = this;
                    this.history = {
                        history: [],
                        historyOwn: []
                    };
                    $.ajax({
                        url: "/" + self.config.lang + "/giveaway/history/" + gw.gw_type + '/' + gw_id,
                        dataType: "json",
                        method: "POST"
                    }).success(function (data) {
                        if (data.status == "success") {
                            self.history = data;
                            self.current_gw = gw;
                            self.status = gw.joined.status;
                            var local = moment(moment.utc(gw.finish).toDate()).format('YYYY-MM-DD HH:mm:ss');
                            var seconds = gw.seconds;
                            Vue.nextTick(function () {
                                $("#timer_modal" + gw.id).countdown(local, function (event) {
                                    var format = "%H:%M:%S";
                                    var piece = 100 / seconds;
                                    var percent = (piece * (seconds - event.offset.totalSeconds)).toFixed(2);
                                    $("#progress" + gw.id).css({
                                        'width': percent + '%'
                                    });
                                    if (gw.type == "hour") {
                                        format = "<span>%M</span> min <span>%S</span> sec";
                                        if (event.offset.totalHours > 0) {
                                            format = "<span>%H</span> hr <span>%M</span> min";
                                        }
                                    }
                                    if (gw.type == "day") {
                                        format = "<span>%H</span> hr <span>%M</span> min";
                                    }
                                    if (gw.type == "week") {
                                        format = "<span>%M</span> min <span>%S</span> sec";
                                        if (event.offset.totalHours > 0) {
                                            format = "<span>%H</span> hr <span>%M</span> min";
                                        }
                                        if (event.offset.totalDays > 0) {
                                            format = "<span>%-d</span> day%!d";
                                        }
                                    }
                                    $(this).html(event.strftime(format));
                                });
                            });
                            Vue.nextTick(function () {
                                show_overlay();
                                $("body").addClass("is-modal");
                                $('#giveaway').show();
                                $("#giveaway .close, .h-giveaway-modal-close,#overlay,.h-giveaway-modal-close a").one("click", function () {
                                    $('#giveaway').hide();
                                    hide_overlay();
                                    self.current_gw = null;
                                });
                            });
                            return false;
                        } else {
                            return ShowMsg(localization.error, localization.unknown_error, "fail", 3000);
                        }
                    }).error(function () {
                        return ShowMsg(localization.error, localization.unknown_error, "fail", 3000);
                    });
                }
            }
        });
    }
}
$(document).on("ready pjax:end", function () {
    if (typeof (giveaway_app) == 'function') {
        giveaway_app();
    }
});

function init_giveaway_info() {
    pjax_fix('#giveaway_info');
    window.giveaway_info = new Vue({
        el: '#giveaway_info',
        data: {
            giveaways: window.active_giveaways.giveaways,
            history: [],
            is_mobile: isMobile,
            current_gw: null,
        },
        created: function () {
            this.init_giveaways();
        },
        methods: {
            give_type_info: function (type_info, type) {
                type_css = (type == 'day') ? 'daily' : type + 'ly';
                var info = {
                    type: type_css,
                    text: {
                        day: localization.prem_daily_text,
                        week: localization.prem_weekly_text,
                        month: localization.prem_monthly_text
                    },
                    css_color: {
                        day: 'green',
                        week: 'purple',
                        month: 'violet',
                    },
                    css_type: {
                        day: type_css + '-giveaway_bg',
                        week: type_css + '-giveaway_bg',
                        month: type_css + '-giveaway_bg',
                    }
                };
                return info[type_info][type];
            },
            currency_calc_amount: function (price) {
                return currency_calc_amount(parseFloat(price));
            },
            get_item_name: function (steam_market_hash_name) {
                var name = steam_market_hash_name.split('|');
                return $.trim(name[0]);
            },
            get_item_type: function (steam_market_hash_name) {
                var name = steam_market_hash_name.split('|');
                return $.trim(name[1]);
            },
            get_exterior: function (ex) {
                var arr = ex.match(/([A-Z])/g);
                if (arr == null || arr.length == 0) return '';
                return arr.join('');
            },
            init_giveaways: function () {
                if (!this.giveaways) {
                    return;
                }
                this.giveaways.forEach(function (giveaway) {
                    var minutes = Math.floor(giveaway.seconds / 60);
                    giveaway['minutes_left'] = minutes;
                    giveaway['seconds_left'] = (giveaway.seconds / 60 - minutes) * 60;
                });
                this.set_timeout(this.giveaways);
            },
            close: function () {
                var self = this;
                $('#give_modal').hide();
                hide_overlay();
                self.current_gw = null;
            },
            set_timeout: function (giveaways) {
                Vue.nextTick(function () {
                    $.each(giveaways, function (index, item) {
                        var local = moment(moment.utc(item.finish).toDate()).format('YYYY-MM-DD HH:mm:ss');
                        $("#timer" + item.id).countdown(local, function (event) {
                            var format = "%H:%M:%S";
                            if (item.type == "day") {
                                format = "<span class='timer-green_text'>%H</span> hr <span class='timer-green_text'>%M</span> min";
                            }
                            if (item.type == "week" || item.type == "month") {
                                format = "<span class='timer-green_text'>%M</span> min <span class='timer-green_text'>%S</span> sec";
                                if (event.offset.totalHours > 0) {
                                    format = "<span class='timer-green_text'>%H</span> hr <span class='timer-green_text'>%M</span> min";
                                }
                                if (event.offset.totalDays > 0) {
                                    format = "<span class='timer-green_text'>%-D</span> day%!D";
                                }
                            }
                            var result = '<span :class="\'light-\'+give_type_info(\'css_color\',giveaway.type)+\'_text\'">' + localization.time_left + ': </span>' + format;
                            $(this).html(event.strftime(result));
                        });
                    });
                    if (isMobile) {
                        $(".owl-carousel").owlCarousel({
                            autoplay: true,
                            items: 1,
                            loop: true,
                        });
                    }
                });
            },
            open_history: function (index) {
                var gw = this.giveaways[index];
                var self = this;
                this.history = {
                    history: [],
                    historyOwn: []
                };
                $.ajax({
                    url: "/" + config.lang + "/giveaway/history/" + gw.type + '/' + gw.gw_id,
                    dataType: "json",
                    method: "POST"
                }).success(function (data) {
                    if (data.status == "success") {
                        self.history = data;
                        self.current_gw = jQuery.extend(true, {}, gw);
                        self.status = gw.joined.status;
                        var local = moment(moment.utc(gw.finish).toDate()).format('YYYY-MM-DD HH:mm:ss');
                        var seconds = gw.seconds;
                        Vue.nextTick(function () {
                            $("#timer_modal" + gw.id).countdown(local, function (event) {
                                var format = "%H:%M:%S";
                                var piece = 100 / seconds;
                                var percent = (piece * (seconds - event.offset.totalSeconds)).toFixed(2);
                                $("#fill" + gw.id).css({
                                    'width': percent + '%'
                                });
                                if (gw.type == "day") {
                                    format = "<span class='timer-green_text'>%H</span> hr <span class='timer-green_text'>%M</span> min";
                                }
                                if (gw.type == "week" || gw.type == "month") {
                                    format = "<span class='timer-green_text'>%M</span> min <span class='timer-green_text'>%S</span> sec";
                                    if (event.offset.totalHours > 0) {
                                        format = "<span class='timer-green_text'>%H</span> hr <span class='timer-green_text'>%M</span> min";
                                    }
                                    if (event.offset.totalDays > 0) {
                                        format = "<span class='timer-green_text'>%-D</span> day%!D";
                                    }
                                }
                                var result = '<span class="time-left" :class="\'light-\'+give_type_info(\'css_color\',giveaway.type)+\'_text\'">' + localization.time_left + ': </span>' + format;
                                $(this).html(event.strftime(result));
                            });
                        });
                        Vue.nextTick(function () {
                            show_overlay();
                            $("body").addClass("is-modal");
                            $('#give_modal').show();
                            $("#give_modal .close, .h-giveaway-modal-close,#overlay,.h-giveaway-modal-close a").one("click", function () {
                                $('#give_modal').hide();
                                hide_overlay();
                                self.current_gw = null;
                            });
                        });
                        return false;
                    } else {
                        return ShowMsg(localization.error, localization.unknown_error, "fail", 3000);
                    }
                }).error(function () {
                    return ShowMsg(localization.error, localization.unknown_error, "fail", 3000);
                });
            },
        }
    });
}
class ArcGradientOptions {
    constructor(options) {
        function validateParam(test, errorMessage, fatal = false) {
            if (!test) {
                if (fatal) {
                    throw new Error(errorMessage);
                } else {
                    console.assert(false, errorMessage);
                }
            }
        }
        options = Object.assign({
            useDegrees: false,
            resolutionFactor: 8,
        }, options);
        validateParam((options.resolutionFactor instanceof Number | typeof options.resolutionFactor === 'number') && options.resolutionFactor > 0, `ArcGradientOptions.resolutionFactor must be a Number greater than 0.  Given: ${options.resolutionFactor}`, true);
        Object.assign(this, options);
    }
};
CanvasRenderingContext2D.prototype.strokeArcGradient = function (x, y, radius, startAngle, endAngle, colorStops, options) {
    options = new ArcGradientOptions(options);
    let lineWidth = this.lineWidth;
    this.fillArcGradient(x, y, startAngle, endAngle, colorStops, radius + lineWidth / 2, radius - lineWidth / 2, options);
}
CanvasRenderingContext2D.prototype.fillArcGradient = function (x, y, startAngle, endAngle, colorStops, outerRadius, innerRadius = 0, options) {
    options = new ArcGradientOptions(options);
    let oldLineWidth = this.lineWidth,
        oldStrokeStyle = this.strokeStyle;
    if (options.useDegrees) {
        startAngle = startAngle * Math.PI / 180;
        endAngle = endAngle * Math.PI / 180;
    }
    let deltaArcAngle = endAngle - startAngle;
    gradientWidth = Math.floor(outerRadius * Math.abs(deltaArcAngle) * options.resolutionFactor), gData = generateGradientImgData(gradientWidth, colorStops).data;
    this.lineWidth = Math.min(4 / options.resolutionFactor, 1);
    for (let i = 0; i < gradientWidth; i++) {
        let gradi = i * 4,
            theta = startAngle + deltaArcAngle * i / gradientWidth;
        this.strokeStyle = `rgba(${gData[gradi]}, ${gData[gradi+1]}, ${gData[gradi+2]}, ${gData[gradi+3]})`;
        this.beginPath();
        this.moveTo(x + Math.cos(theta) * innerRadius, y + Math.sin(theta) * innerRadius);
        this.lineTo(x + Math.cos(theta) * outerRadius, y + Math.sin(theta) * outerRadius);
        this.stroke();
        this.closePath();
    }
    this.lineWidth = oldLineWidth;
    this.strokeStyle = oldStrokeStyle;
}

function generateGradientImgData(width, colorStops) {
    let canvas = document.createElement('canvas');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', 1);
    let ctx = canvas.getContext('2d'),
        gradient = ctx.createLinearGradient(0, 0, width, 0);
    for (let i = 0; i < colorStops.length; i++) {
        gradient.addColorStop(colorStops[i].offset, colorStops[i].color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 1);
    canvas.remove();
    return ctx.getImageData(0, 0, width, 1);
}

function drawMultiRadiantCircle(xc, yc, r, radientColors) {
    var partLength = (2 * Math.PI) / radientColors.length;
    var start = 0;
    var gradient = null;
    var startColor = null,
        endColor = null;
    for (var i = 0; i < radientColors.length; i++) {
        startColor = radientColors[i];
        endColor = radientColors[(i + 1) % radientColors.length];
        var xStart = xc + Math.cos(start) * r;
        var xEnd = xc + Math.cos(start + partLength) * r;
        var yStart = yc + Math.sin(start) * r;
        var yEnd = yc + Math.sin(start + partLength) * r;
        ctx.beginPath();
        gradient = ctx.createLinearGradient(xStart, yStart, xEnd, yEnd);
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1.0, endColor);
        ctx.strokeStyle = gradient;
        ctx.arc(xc, yc, r, start, start + partLength);
        ctx.stroke();
        ctx.closePath();
        start += partLength;
    }
}

function create_circle() {
    let ctx = $('#canvas_full')[0].getContext('2d');
    let side = 400;
    let colorStops = [];
    let border = 10;
    let side_2 = side / 2;
    for (let i = 0; i < colors.length; i++) {
        colorStops.push({
            offset: i / (colors.length - 1),
            color: colors[i]
        });
    }
    ctx.fillArcGradient(side, side_2, 0, 360, colorStops, side_2, side_2 - border, {
        useDegrees: true
    });
    let ctx2 = $('#canvas')[0].getContext('2d');
    ctx2.fillArcGradient(side, side_2, 0, 360, [{
        offset: 0,
        color: '#242A2F'
    }], side_2 + 1, side_2 - border - 1, {
        useDegrees: true
    });
}

function set_circle_percent(percent) {
    let ctx = $('#canvas')[0].getContext('2d');
    let side = 400;
    let colorStops = [];
    let border = 10;
    let side_2 = side / 2;
    for (let i = 0; i < colors.length; i++) {
        colorStops.push({
            offset: i / (colors.length - 1),
            color: colors[i]
        });
    }
    let percent_deg = -360 * ((100 - percent) / 100);
    ctx.clearRect(0, 0, 800, 800);
    ctx.fillArcGradient(side, side_2, 0, 360, [], side_2, side_2 - border, {
        useDegrees: true
    });
    ctx.fillArcGradient(side, side_2, 0, percent_deg, [{
        offset: 0,
        color: '#242A2F'
    }], side_2 + 1, side_2 - border - 1, {
        useDegrees: true
    });
}
const colors = ['#FF4F48', '#F5C245', '#68E756', '#03A35C'];
var upgrade_tpl = '';

function upgrade_initialize() {
    Vue.component('currency', {
        template: '<i class="cur success" ' + set_data_before() + '></i>'
    });
    if ($('#upgrade_top').length > 0) {
        pjax_fix('#upgrade_top');
        window.upgrade_top = new Vue({
            el: '#upgrade_top',
            data: {
                history: {
                    history: [],
                    biggest: []
                },
                offset: 'week',
                is_mobile: isMobile
            },
            created: function () {
                var self = this;
                $.getJSON("/" + config.lang + "/upgrade/ajax_top", function (data) {
                    self.history = data;
                });
            },
            methods: {
                calc_amount: function (price) {
                    return currency_calc_amount(parseFloat(price));
                }
            },
            filters: {
                round: function (value) {
                    if (!value) return '';
                    return parseFloat(value).toFixed(2);
                }
            },
            watch: {
                offset: function (newVal, oldVal) {
                    if (newVal == oldVal) return false;
                    var self = this;
                    $.ajax({
                        method: 'GET',
                        url: "/" + config.lang + "/upgrade/ajax_top?offset=" + newVal,
                        dataType: 'json',
                        success: function (data) {
                            self.history = data;
                        },
                    });
                },
            }
        });
    }
    if ($('#upgrade_history').length > 0) {
        pjax_fix('#upgrade_history');
        window.upgrade_history = new Vue({
            el: '#upgrade_history',
            data: {
                history: [],
                config: config,
                provably_fair_game_id: null,
            },
            created: function () {
                var self = this;
                $.getJSON("/" + config.lang + "/upgrade/ajax_history", function (data) {
                    self.history = data.history;
                });
            },
            updated: function () {
                Vue.nextTick(function () {
                    $('.upgrade-block-bottom button').click(function (e) {
                        $(this).siblings('.provably_fair-info').slideToggle();
                    });
                });
            },
            methods: {
                short_long_string: function (str) {
                    return short_long_string(str, '...');
                },
                check_game: function (game_id) {
                    var self = this;
                    this.provably_fair_game_id = game_id;
                    this.$nextTick(function () {
                        self.$refs.form_check_game_by_id.submit();
                    });
                }
            }
        });
    }
    if ($('#upgrader').length == 0) {
        return false;
    }
    pjax_fix('#upgrader');
    window.upgrade = new Vue({
        el: '#upgrader',
        data: {
            modal_showed: false,
            items: [],
            user_items: [],
            chance: 0,
            selected_win_item_id: 0,
            selected_user_item_id: 0,
            selected_win_item: false,
            selected_user_item: false,
            price: 0,
            balance: 0,
            max_price: 0,
            items_total_page: 0,
            upgrade_type: 'item',
            view: 'main',
            limit: 20,
            current_page_user_items: 0,
            current_page_win_items: 1,
            upgrade_status: '',
            search: '',
            price_from: 0,
            price_to: 0,
            show_search: false,
            sort_by: 'price',
            sort_user_by: 'id',
            user_desc: false,
            desc: 'n',
            rarity: '',
            us: 0.70,
            cashback: 0,
            min_price: 0.1,
            min_price_default: 0.1,
            min_chance: 1,
            max_low_chances: 10,
            low_chances_made: 0,
            low_chance: 5,
            is_active: 0,
            is_fast: false,
            is_play: false,
            is_toggle: false,
            range_from: 0,
            range_to: 0,
            ticker_spin: 0,
            sound: config.HTTPS_CDN_DOMAIN + "/hellcase/img/web/upgrader/upgrade_tick.wav",
            sound_spin: null,
            sound_interval: null,
            make_data: {},
            symbol: config.CURRENCY_SYMBOL,
            select_rarity: false,
            _token: null,
            start_deg: -85.5,
            multiplier: 0.9,
            games: [],
            rarities: ['common', 'uncommon', 'rare', 'mythical', 'legendary', 'immortal', 'arcana'],
            canvas: null,
            provably_fair: {
                public_key: '',
                client_key: '',
            }
        },
        created: function () {
            var self = this;
            var game = config.PROJECT;
            var games = $('#upgrader').data('games');
            for (var key in games) {
                var selected = false;
                if (games[key] === game) {
                    selected = true;
                }
                self.games.push({
                    is_selected: selected,
                    name: games[key]
                });
            }
            this.sound_spin = new Audio(this.sound);
            this.sound_spin.volume = 0.1;
            var status_sound = localStorage.getItem('sound');
            if (status_sound == 'off')
                $('.sound').addClass('off');
            else
                $('.sound').addClass('on');
            this.get_user_items(function (items) {
                Vue.nextTick(function () {
                    $('.rate-sum input').click(function () {
                        $(this).select();
                    });
                });
                routie({
                    ':item_id': function (item_id) {
                        var found = false;
                        for (var i in self.user_items) {
                            if (self.user_items[i].id == item_id) {
                                self.selected_user_item_id = item_id;
                                self.selected_user_item = self.user_items[i];
                                self.get_all_items();
                                found = true;
                            }
                        }
                        if (found == false) {
                            self.get_all_items();
                        }
                    },
                    'item/:item_id': function (item_id) {
                        console.log(item_id);
                        $.post("/" + config.lang + "/upgrade/get_item", {
                            item_id: item_id
                        }, function (data) {
                            if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                                self.selected_win_item_id = item_id;
                                self.selected_win_item = data;
                            }
                        });
                    },
                    '*': function () {
                        self.get_all_items();
                    }
                });
            });
            Vue.nextTick(function () {
                $('.fairy-play button').click(function (e) {
                    $(this).siblings('.fairy-info').fadeToggle();
                });
                $(document).click(function (event) {
                    if ($(event.target).closest(".fairy-play").length) return;
                    $('.fairy-play .fairy-info').fadeOut();
                    event.stopPropagation();
                });
                $('#canvas').attr('width', 400 * 2 + 8).attr('height', 400);
                $('#canvas_full').attr('width', 400 * 2 + 8).attr('height', 400);
                $('.js-copy').click(function () {
                    copyTextToClipboard($(this).data('title'));
                    ShowMsg(localization.success, 'copied on buffer', 'success', 10000);
                });
                create_circle();
            });
        },
        computed: {
            chance_dash: function () {
                var one_dash = 100 / 24;
                return Math.floor(this.chance / one_dash);
            },
            user_items_total_page: function () {
                var self = this;
                var items = this.user_items.filter(function (val) {
                    return self.is_show_game(val.game)
                });
                return Math.ceil(items.length / this.limit);
            },
            user_items_pagi: function () {
                var self = this;
                if (this.limit == 0) {
                    this.limit = 20;
                }
                return this.user_items.filter(function (a) {
                    return self.is_show_game(a.game);
                }).slice(this.current_page_user_items * this.limit, (this.current_page_user_items + 1) * this.limit);
            },
            no_money: function () {
                if (this.upgrade_type == 'balance' && this.selected_win_item_id > 0) {
                    if (parseFloat(this.balance) < parseFloat(this.price)) {
                        return true;
                    }
                }
                return false;
            },
            max_low_chances_made: function () {
                return this.low_chances_made >= this.max_low_chances && this.chance <= this.low_chance;
            },
            invalid_sum_range: function () {
                if (this.selected_win_item_id == 0) {
                    return true;
                }
                if (this.upgrade_type == 'balance' && this.selected_win_item_id > 0) {
                    if (parseFloat(this.price) >= parseFloat(this.selected_win_item.steam_price_en)) {
                        return true;
                    }
                }
                if (this.upgrade_type == 'item' && this.selected_win_item_id > 0 && this.selected_user_item != 0) {
                    if (parseFloat(this.selected_user_item.win_price) >= parseFloat(this.selected_win_item.steam_price_en)) {
                        return true;
                    }
                }
                if (this.chance < this.min_chance) {
                    return true;
                }
                return false;
            }
        },
        watch: {
            is_fast: function (val) {
                if (val) {
                    ShowMsg(localization.success, localization.upgrade_fast_on, 'success', 2000);
                } else {
                    ShowMsg(localization.success, localization.upgrade_fast_off, 'success', 2000);
                }
            },
            chance: function (val) {
                set_circle_percent(val);
            },
            price: function (val) {
                if (this.upgrade_type == 'balance' && this.selected_win_item_id > 0) {
                    var price = this.selected_win_item.steam_price_en;
                    this.min_price = (price / 100).toFixed(2);
                    if (this.min_price < this.min_price_default) {
                        this.min_price = this.min_price_default;
                    }
                    if (this.min_price == 0) {
                        this.min_price = 0.1;
                    }
                    this.chance = (this.price / (price / 100)).toFixed(2);
                    this.chance = (parseFloat(val) / parseFloat(price) * parseFloat(this.multiplier) * 100).toFixed(2);
                    if (this.chance > 100) {
                        this.chance = 100 - (100 * (1 - this.us));
                        this.max_price = this.chance * price;
                    }
                }
            },
            upgrade_type: function (val, oldVal) {
                if (this.is_play) {
                    return false;
                }
                if (val != oldVal) {
                    this.get_all_items();
                }
            },
            rarity: function () {
                this.current_page_win_items = 1;
                this.get_all_items();
            },
            range_from: function (val, oldVal) {
                this.current_page_win_items = 1;
                val = parseFloat(val);
                if (isNaN(val)) {
                    this.range_from = 0;
                }
                if (val == oldVal) {
                    return false;
                }
                if (this.range_from > this.range_to && this.range_to > 0) {}
                this.get_all_items();
            },
            range_to: function (val, oldVal) {
                this.current_page_win_items = 1;
                if (isNaN(val)) {
                    this.range_to = 0;
                }
                if (val == oldVal) {
                    return false;
                }
                val = parseFloat(val);
                if (this.range_from > this.range_to && this.range_to > 0) {}
                this.get_all_items();
            }
        },
        methods: {
            checkAuth: function () {
                if (this.items.length == 0) {
                    window.open('https://hellcase.com/login');
                } else {
                    this.view = 'selected_user_item';
                }
            },
            short_long_string: function (str) {
                return str;
            },
            choose_game: function (game) {
                this.games.forEach(function (t) {
                    if (t.name === game.name) {
                        t.is_selected = !game.is_selected;
                    }
                });
            },
            is_show_game: function (game) {
                return this.games.some(function (element) {
                    return element.name === game && element.is_selected === true
                });
            },
            round_price: function (price) {
                return currency_calc_amount(parseFloat(price));
            },
            dynamicSort: function (property, direction) {
                var sortOrder = 1;
                if (direction == true) {
                    sortOrder = -1;
                }
                return function (a, b) {
                    a[property] = parseFloat(a[property]);
                    b[property] = parseFloat(b[property]);
                    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                    return result * sortOrder;
                }
            },
            toggle_type: function (type) {
                if (typeof (type) == 'undefined') {
                    if (this.upgrade_type == 'item') {
                        type = 'balance';
                    } else {
                        type = 'item';
                    }
                }
                if (type == 'item' && this.user_items.length == 0) {
                    this.upgrade_type = 'balance';
                    return false;
                }
                this.selected_user_item = 0;
                this.selected_user_item_id = 0;
                if (type == 'item') {
                    this.price = 0;
                }
                this.upgrade_type = type;
                this.get_chance();
            },
            next_page_user_items: function () {
                if (this.current_page_user_items < this.user_items_total_page - 1) {
                    this.current_page_user_items = this.current_page_user_items + 1;
                }
            },
            prev_page_user_items: function () {
                if (this.current_page_user_items > 0) {
                    this.current_page_user_items = this.current_page_user_items - 1;
                }
            },
            get_price: function () {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/upgrade/by_balance_get_price',
                    type: 'POST',
                    data: {
                        selected_itemid: self.selected_win_item_id,
                        chance: this.chance
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.price = data.price;
                        }
                    }
                });
            },
            get_chance: function () {
                var self = this;
                if (this.selected_win_item_id == 0) {
                    self.chance = 0;
                    return false;
                }
                if (this.upgrade_type == 'balance') {
                    if (self.price == 0) return false;
                    var item_price = self.selected_win_item.price;
                    self.chance = (parseFloat(self.price) / parseFloat(item_price) * parseFloat(this.multiplier) * 100).toFixed(2);
                } else {
                    if (self.selected_user_item_id == 0) {
                        self.chance = 0;
                        return false;
                    }
                    var user_price = self.selected_user_item.win_price;
                    var item_price = self.selected_win_item.price;
                    self.chance = (parseFloat(user_price) / parseFloat(item_price) * parseFloat(this.multiplier) * 100).toFixed(2);
                }
                var max_chance = this.us * 100;
                if (self.chance > max_chance) {
                    self.chance = max_chance;
                }
            },
            get_user_items: function (cb) {
                var self = this;
                $.ajax({
                    url: '/' + config.lang + '/upgrade/get_items',
                    type: 'POST',
                    data: {
                        page: 1,
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.user_items = data.items;
                            self.user_items.sort(self.dynamicSort(self.sort_user_by, self.user_desc));
                            self.balance = data.balance;
                            self.is_active = parseInt(data.is_active);
                            self.max_low_chances = parseInt(data.max_low_chances);
                            self.low_chances_made = parseInt(data.low_chances_made);
                            self.low_chance = parseInt(data.low_chance);
                            self._token = data._token;
                            if (self.user_items.length == 0) {
                                self.upgrade_type = 'balance';
                            }
                            if (typeof (cb) !== 'undefined') {
                                cb(data.items);
                            }
                        }
                    }
                });
            },
            get_all_items: function () {
                var self = this;
                var price = 0;
                this.limit = Math.floor($('.items-container:last-child .items-wrap').width() / $('.items-container:last-child .items-wrap .item').outerWidth()) * 4;
                if (this.limit | 0 == 0) {
                    this.limit = 20;
                }
                if (this.upgrade_type === 'item' && this.selected_user_item_id > 0) {
                    price = self.selected_user_item.win_price;
                }
                $.ajax({
                    url: '/' + config.lang + '/upgrade/get_all_items',
                    type: 'POST',
                    data: {
                        page: self.current_page_win_items,
                        search: this.search,
                        price: parseFloat(price),
                        limit: parseInt(this.limit),
                        range_from: parseFloat(this.range_from),
                        range_to: parseFloat(this.range_to),
                        sort_by: this.sort_by,
                        rarity: this.rarity,
                        desc: this.desc,
                        type: this.upgrade_type
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            self.items = data.items;
                            self.items_total_page = data.total_page;
                            self.us = data.us;
                            self.multiplier = data.multiplier;
                            self.min_chance = data.min_chance;
                            self.min_price_default = data.min_price;
                            if (typeof (data.provably_fair) != 'undefined') {
                                self.provably_fair = data.provably_fair;
                            }
                        }
                    }
                });
            },
            next_page_win_items: function () {
                if (this.current_page_win_items == this.items_total_page || this.items_total_page < 1) {
                    return false;
                }
                this.current_page_win_items = this.current_page_win_items + 1;
                this.get_all_items();
            },
            prev_page_win_items: function () {
                if (this.current_page_win_items <= 1) {
                    return false;
                }
                this.current_page_win_items = this.current_page_win_items - 1;
                this.get_all_items();
            },
            select_win_item: function (item) {
                if (this.is_play) {
                    return false;
                }
                this.view = 'main';
                this.selected_win_item = item;
                this.selected_win_item_id = item.id;
                this.max_price = (item.steam_price_en - (item.steam_price_en * (1 - this.us))).toFixed(2);
                this.price = this.max_price;
                this.min_price = (this.price / 100).toFixed(2);
                if (this.min_price < 0.1) {
                    this.min_price = 0.1;
                }
                var p1 = parseFloat(this.price);
                var p2 = parseFloat(this.balance);
                if (p1 > p2) {
                    this.price = p2;
                }
                this.get_chance();
            },
            sort_win_item: function (col) {
                if (this.desc == 'y') {
                    this.desc = 'n';
                } else {
                    this.desc = 'y';
                }
                this.sort_user_by = col;
                this.current_page_win_items = 1;
                this.get_all_items();
            },
            sort_user_item: function (col) {
                this.user_desc = !this.user_desc;
                this.sort_user_by = col;
                this.user_items.sort(this.dynamicSort(col, this.user_desc));
            },
            select_user_item_by_open_id(open_id) {
                var open_id_found = this.user_items.filter(function (a) {
                    return a.id == open_id;
                });
                if (open_id_found.length > 0) {
                    this.select_user_item(open_id_found[0]);
                }
            },
            select_user_item: function (item) {
                if (this.upgrade_type != 'item') {
                    return false;
                }
                if (this.is_play) {
                    return false;
                }
                var self = this;
                this.view = 'main';
                this.selected_user_item = item;
                this.current_page_win_items = 1;
                this.selected_user_item_id = item.id;
                Vue.nextTick(function () {
                    self.get_all_items();
                    self.get_chance();
                });
            },
            get_exterior: function (ex) {
                var arr = ex.match(/([A-Z])/g);
                if (arr == null || arr.length == 0) return '';
                return arr.join('');
            },
            remove_item: function () {
                if (this.is_play) {
                    return false;
                }
                this.selected_user_item_id = 0;
                this.selected_user_item = false;
            },
            roll_toggle: function () {
                if (this.is_play) {
                    return false;
                }
                this.is_toggle = !this.is_toggle;
            },
            reset_spin: function () {
                if (self.is_play) return false;
                $('.pointer').css('transform', 'rotate(0deg)');
                $('.pointer').css('transition', 'all 0s');
            },
            spin: function (win_value, callback) {
                var self = this;
                self.upgrade_status = '';
                $('.pointer').css('transform', 'rotate(0deg)');
                $('.pointer').css('transition', 'all 0s');
                setTimeout(function () {
                    if (self.is_fast) {
                        $('.pointer').css('transition', 'all 500ms');
                    } else {
                        $('.pointer').css('transition', 'all 5s cubic-bezier(0.165, 0.84, 0.44, 1)');
                        self.play_sound_loop(50);
                    }
                    var deg = win_value * (360 / 100);
                    var loop_spin = (360 * 3) + deg;
                    $('.pointer').css('transform', 'rotate(' + loop_spin + 'deg)');
                    if (self.is_fast) {
                        setTimeout(callback, 100);
                    } else {
                        setTimeout(callback, 5000);
                    }
                }, 500);
            },
            unit_test: function () {
                var self = this;
                setInterval(function () {
                    self.chance = (Math.random() * (80 - 60) + 60).toFixed(2);
                    var win = (Math.random() * (90 - 60) + 60).toFixed(2);
                    self.is_fast = true;
                    var upgrade_status = '?';
                    self.make_data = {};
                    if (self.chance > win) {
                        upgrade_status = 'win ' + self.chance + ' - win: ' + win;;
                    } else {
                        upgrade_status = 'loose chance: ' + self.chance + ' - win: ' + win;
                    }
                    self.make_data.status = upgrade_status;
                    self.make_data.win = (self.chance > win);
                    self.spin(win);
                    console.log(upgrade_status);
                }, 3000);
            },
            play_sound_loop: function (time) {
                if (localStorage.getItem('sound') == 'off') {
                    return false;
                }
                var self = this;
                time = self.ticker_spin + time;
                self.ticker_spin = self.ticker_spin + 1;
                setTimeout(function () {
                    if (self.is_play) {
                        self.play_sound_spin();
                        self.play_sound_loop(time);
                    }
                }, time);
            },
            submit: function () {
                var self = this;
                if (this.is_play) {
                    return false;
                }
                if (this.no_money) {
                    return false;
                }
                if (this.invalid_sum_range) {
                    return false;
                }
                if (this.chance == 0) {
                    return false;
                }
                if (this.selected_win_item_id == 0) {
                    console.debug('no win item');
                    return false;
                }
                if (this.selected_user_item_id == 0 && this.upgrade_type == 'item') {
                    console.debug('no user item');
                    return false;
                }
                if (this.low_chances_made > this.max_low_chances && this.chance <= this.low_chance) {
                    ShowMsg(localization.error, localization.limit_low_chances.format(this.max_low_chances, this.low_chance), 'error', 5000);
                    return false;
                }
                this.is_play = true;
                this.cashback = 0;
                this.upgrade_status = '';
                var direction = 'under';
                if (this.is_toggle) {
                    direction = 'over';
                }
                if (this.selected_user_item == null) {
                    var game = '';
                } else {
                    var game = this.selected_user_item.game;
                }
                $.ajax({
                    url: '/' + config.lang + '/upgrade/make',
                    type: 'POST',
                    data: {
                        chance: this.chance,
                        id: this.selected_user_item_id,
                        item_id_new: this.selected_win_item_id,
                        game: game,
                        type: this.upgrade_type,
                        _token: this._token,
                        direction: direction
                    },
                    dataType: 'json',
                    success: function (data) {
                        self.make_data = data;
                        self._token = data._token;
                        if (data.status == Hell.RESPONSE_STATUS_SUCCESS) {
                            if (typeof (data.provably_fair) != 'undefined') {
                                self.provably_fair = data.provably_fair;
                            }
                            self.spin(data.value, function () {
                                clearInterval(self.sound_interval);
                                if (data.win) {
                                    self.upgrade_status = 'win';
                                } else {
                                    self.upgrade_status = 'loose';
                                }
                                self.cashback = data.cashback.toFixed(2);
                                if (self.cashback > 0) {
                                    var timeout = 2500;
                                } else {
                                    var timeout = 1500;
                                }
                                setTimeout(function () {
                                    if (self.is_play == false) {
                                        self.upgrade_status = '';
                                        self.cashback = 0;
                                        self.reset_spin();
                                    }
                                }, timeout);
                                if (data.win == false && self.upgrade_type == 'balance') {
                                    self.is_play = false;
                                    self.selected_user_item = {};
                                    self.selected_user_item_id = 0;
                                    if (self.upgrade_type == 'balance') {
                                        setTimeout(function () {
                                            self.get_chance();
                                        }, 2500);
                                    } else {
                                        self.selected_win_item_id = 0;
                                        self.selected_win_item = {};
                                    }
                                } else {
                                    self.get_user_items(function (items) {
                                        if (data.win) {
                                            self.selected_win_item_id = 0;
                                            self.selected_win_item = {};
                                            setTimeout(function () {
                                                self.chance = 0;
                                                self.price = 0;
                                                self.upgrade_type = 'item';
                                                Vue.nextTick(function () {
                                                    self.is_play = false;
                                                    self.select_user_item_by_open_id(data.win_open_id);
                                                });
                                            }, 1000);
                                        } else {
                                            self.is_play = false;
                                            self.selected_user_item = {};
                                            self.selected_user_item_id = 0;
                                            if (self.upgrade_type == 'balance') {
                                                setTimeout(function () {
                                                    self.get_chance();
                                                }, 2500);
                                            } else {
                                                self.selected_win_item_id = 0;
                                                self.selected_win_item = {};
                                            }
                                        }
                                    });
                                }
                                updateBalance(data.balance);
                            });
                        } else {
                            self.is_play = false;
                            self.upgrade_status = '';
                            self.cashback = 0;
                            self.reset_spin();
                            if (data.error_message == 'only_premium') {
                                ShowSubscribeModal();
                                return false;
                            }
                            show_notification_error(data.error_message);
                        }
                    }
                });
            },
            play_sound_spin: function () {
                this.sound_spin.currentTime = 0;
                this.sound_spin.play();
            },
            close_search: function () {
                this.show_search = false;
                this.search = '';
                this.get_all_items();
            },
            show_modal_win_item: function () {
                if (this.selected_user_item_id > 0 || this.upgrade_type == 'balance') {
                    this.view = 'selected_win_item';
                }
            },
            add_balance: function () {
                ShowAddBalanceModal();
            }
        },
    });
}

function event_initialize() {
    pjax_fix('.event-container');
    window.event_page = new Vue({
        el: '.event-container',
        data: {
            items: [],
            limit: 999,
            filter: 'all',
            modal: {
                show: false,
                modal_type: 'shop',
                name: '',
                image: '',
                class: '',
                token: 0,
                case_link: '',
                value: '',
                type: '',
                item: {},
            },
            user_subscribed: false,
            only_shop: false,
            can_buy_at_shop: false,
            current_tokens: 0,
            event_id: 0,
            refilled: 0,
            is_lock: false,
            rewards: {},
        },
        created: function () {
            this.bind_js();
            this.countdown();
            this.items = event.shop_items;
            this.user_subscribed = event.user_subscribed;
            this.current_tokens = event.current_tokens;
            this.rewards = event.rewards_state;
            this.event_id = event.event_id;
            this.refilled = event.refilled;
        },
        computed: {
            last_not_earned_reward: function () {
                if (this.rewards == {}) {
                    return false;
                }
                var qq = Object.values(this.rewards).filter(function (a) {
                    return !a.is_available && !a.is_done;
                });
                if (qq.length == 0) {
                    return false;
                }
                return qq[0];
            },
            opened_rewards: function () {
                if (this.rewards == {}) {
                    return [];
                }
                return Object.values(this.rewards).filter(function (a) {
                    return a.is_done;
                });
            },
            computed_rewards: function () {
                if (this.rewards == {}) {
                    return this.rewards;
                }
                var result = {};
                var t = 1;
                for (var i = 1; i <= 5; i++) {
                    result[i] = {};
                    for (var j = 1; j <= 6 - i; j++, t++) {
                        result[i][t] = this.rewards[t];
                    }
                }
                return result;
            },
            secret_shop_count: function () {
                var count = Math.ceil(this.filtered_items.length / 3);
                return count;
            },
            filtered_items: function () {
                var self = this;
                return this.items.filter(function (item) {
                    if (item.type == 'case' && item.data.enabled == 0) return false;
                    if (self.filter == 'all') return item;
                    if (self.filter == 'cases' && item.type == 'case') return item;
                    if (self.filter == 'skins' && item.type == 'item' && item.project != 'games') return item;
                    if (self.filter == 'games' && item.type == 'item' && item.project == 'games') return item;
                    if (self.filter == 'other' && (item.type == 'balance' || item.type == 'subscription')) return item;
                });
            },
            finally_ended: function () {
                return 1;
            },
        },
        methods: {
            bind_js: function () {
                Vue.nextTick(function () {
                    $('.accordion-header').toggleClass('inactive-header');
                    $('.accordion-header').first().toggleClass('active-header').toggleClass('inactive-header');
                    $('.accordion-content').first().slideDown().toggleClass('open-content');
                    $('.accordion-header').click(function () {
                        if ($(this).is('.inactive-header')) {
                            $('.active-header').toggleClass('active-header').toggleClass('inactive-header').next().slideToggle().toggleClass('open-content');
                            $(this).toggleClass('active-header').toggleClass('inactive-header');
                            $(this).next().slideToggle().toggleClass('open-content');
                        } else {
                            $(this).toggleClass('active-header').toggleClass('inactive-header');
                            $(this).next().slideToggle().toggleClass('open-content');
                        }
                    });
                    $('.event-faq-wrapper .close, #overlay').click(function () {
                        $('.event-faq-wrapper').removeClass('bounceInUp').addClass('bounceOutDown').delay(1000).queue(function () {
                            $('.event-faq-wrapper').hide();
                        });
                        hide_overlay();
                        return false;
                    });
                    $('#js-show-event-faq').click(function () {
                        $('.event-faq-wrapper').removeClass('bounceOutDown').addClass('bounceInUp').show();
                        show_overlay();
                        return false;
                    });
                });
            },
            countdown: function () {
                if (typeof (event.time_finished) == 'undefined') return false;
                var time_finished = moment(event.time_finished);
                var time_finished_shop = moment(event.time_finished_shop);
                var time_now = moment();
                var local;
                if (time_finished >= time_now) {
                    local = time_finished.format('YYYY-MM-DD HH:mm:ss');
                } else {
                    local = moment(event.time_finished_shop).format('YYYY-MM-DD HH:mm:ss');
                    this.only_shop = true;
                }
                if (time_finished_shop >= time_now) {
                    this.can_buy_at_shop = true;
                }
                var event_name = location.pathname.split('/')[3];
                if (this.can_buy_at_shop) {
                    Vue.nextTick(function () {
                        $('.event-heading__timer').countdown(local, function (e) {
                            format = '\
                            <div class="event-heading__timer-item"><div class="event-heading__timer-number">%D</div><div class="event-heading__timer-text">DAYS</div></div>\
                            <div class="event-heading__timer-item"><div class="event-heading__timer-number">%H</div> <div class="event-heading__timer-text">HOURS</div></div>\
                            <div class="event-heading__timer-item"><div class="event-heading__timer-number">%M</div> <div class="event-heading__timer-text">MINUTES</div></div>\
                            <div class="event-heading__timer-item"><div class="event-heading__timer-number">%S</div> <div class="event-heading__timer-text">SECONDS</div></div>';
                            var percent_html = '<div class="event-heading__timer-loader" style="width: 100%"></div>';
                            $(this).html(percent_html + e.strftime(format));
                        });
                    });
                }
            },
            close_modal: function () {
                this.modal = {
                    show: false,
                    name: '',
                    image: '',
                    class: '',
                    value: '',
                    type: '',
                    token: 0,
                    case_link: '',
                    item: {},
                };
                hide_overlay();
            },
            prebuy_item: function (item) {
                var self = this;
                this.modal.show = true;
                this.modal.item = item;
                this.modal.type = item.type;
                this.modal.token = item.price;
                if (typeof (item.reward_strict_data) != 'undefined') {
                    this.modal.modal_type = 'reward';
                    item.type = item.reward_type;
                    this.modal.type = item.type;
                    if (item.type == 'item') {
                        this.modal.name = item.reward_strict_data.steam_market_hash_name;
                        this.modal.image = item.reward_strict_data.steam_image;
                        this.modal.class = item.reward_strict_data.rarity;
                    }
                    if (item.type == 'balance') {
                        this.modal.name = item.reward_strict_data.sum + ' Hellcase Balance';
                        this.modal.class = 'money';
                        this.modal.image = self.url_path('/img/events/the_international_2019/event-hellcase-balance_img.png');
                        this.modal.value = item.reward_strict_data.sum;
                    }
                    if (item.type == 'token') {
                        this.modal.name = item.reward_strict_data.sum + ' Hellcase tokens';
                        this.modal.class = 'token';
                        this.modal.image = self.url_path('/img/events/christmas/landing-token.png');
                        this.modal.value = item.reward_strict_data.sum;
                    }
                    if (item.type == 'case') {
                        this.modal.name = item.reward_strict_data.casename + ' case';
                        this.modal.image = item.reward_strict_data.icon;
                        this.modal.case_link = item.case_link;
                    }
                } else {
                    this.modal.modal_type = 'shop';
                    if (item.type == 'item') {
                        this.modal.name = item.data.steam_market_hash_name;
                        this.modal.image = item.data.steam_image;
                        this.modal.class = item.data.rarity;
                    }
                    if (item.type == 'balance') {
                        this.modal.name = item.data.amount + ' Hellcase Balance';
                        this.modal.class = 'money';
                        this.modal.image = self.url_path('/img/events/the_international_2019/event-hellcase-balance_img.png');
                        this.modal.value = item.data.amount;
                    }
                    if (item.type == 'case') {
                        this.modal.name = item.data.casename;
                        this.modal.image = item.data.icon;
                        this.modal.case_link = 'mock';
                    }
                    if (item.type == 'subscription') {
                        this.modal.name = 'Hellcase Premium';
                        this.modal.image = self.url_path('/img/events/the_international_2019/event-hellcase-premium_img.png');
                    }
                }
                return false;
            },
            update_event_balance: function (val) {
                $('.event-secret-shop__your-balance-bonus').html(val);
                this.current_tokens = val;
            },
            buy_item: function (item) {
                var self = this;
                if (this.is_lock) return false;
                if (this.current_tokens < this.modal.token) {
                    ShowMsg(localization.error, 'Not enough tokens', 'error', 3000);
                    return false;
                }
                this.is_lock = true;
                $.ajaxSetup({
                    type: "GET",
                    xhrFields: {
                        withCredentials: true
                    },
                    crossDomain: true
                });
                $.get(base_url_path('/' + config.lang + '/event/buy', item.project), {
                    event_id: item.event_id,
                    id: item.id
                }, function (response) {
                    setTimeout(function () {
                        self.is_lock = false;
                    }, 2000);
                    if (response.status == 'success') {
                        self.update_event_balance(response.user_currency);
                        ShowMsg(localization.success, localization.event_buy_success, 'success', 3000);
                        if (typeof (response.balance) != 'undefined') {
                            updateBalance(response.balance);
                        }
                        if (response.case_link && response.case_link !== '') {
                            window.location.href = response.case_link;
                        }
                        self.close_modal();
                    } else {
                        show_notification_error(response.error_message);
                    }
                });
            },
            get_exterior: function (ex) {
                var arr = ex.match(/([A-Z])/g);
                if (arr == null || arr.length == 0) return '';
                return arr.join('');
            },
            split_name: function (market_hash_name, index) {
                if (market_hash_name.indexOf('StatTrak™') !== -1) {
                    market_hash_name = market_hash_name.slice(10);
                }
                var name = market_hash_name.split("|");
                return name[index];
            },
            url_path: function (url) {
                return base_url_path(url, 'csgo');
            },
            case_path: function (name, project) {
                return base_url_path('/' + config.lang + '/open/' + name, project);
            },
            claim_reward: function (level) {
                var self = this;
                $.post('/' + config.lang + '/event/reward', {
                    event_id: this.event_id,
                    level: level
                }, function (response) {
                    if (response.status == 'success') {
                        self.rewards[level].is_done = true;
                        Vue.set(self.rewards[level], 'recieved', {
                            type: response.reward_type,
                            sum: response.reward_strict_data.sum,
                            data: response.reward_strict_data,
                        });
                        self.prebuy_item(response);
                    } else {
                        show_notification_error(response.error_message);
                    }
                });
            }
        },
    });
}