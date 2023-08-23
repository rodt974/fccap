var $jscomp = $jscomp || {};
$jscomp.scope = {}, $jscomp.arrayIteratorImpl = function(t) {
    var e = 0;
    return function() {
        return e < t.length ? {
            done: !1,
            value: t[e++]
        } : {
            done: !0
        }
    }
}, $jscomp.arrayIterator = function(t) {
    return {
        next: $jscomp.arrayIteratorImpl(t)
    }
}, $jscomp.ASSUME_ES5 = !1, $jscomp.ASSUME_NO_NATIVE_MAP = !1, $jscomp.ASSUME_NO_NATIVE_SET = !1, $jscomp.SIMPLE_FROUND_POLYFILL = !1, $jscomp.ISOLATE_POLYFILLS = !1, $jscomp.FORCE_POLYFILL_PROMISE = !1, $jscomp.FORCE_POLYFILL_PROMISE_WHEN_NO_UNHANDLED_REJECTION = !1, $jscomp.defineProperty = $jscomp.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function(t, e, n) {
    return t == Array.prototype || t == Object.prototype || (t[e] = n.value), t
}, $jscomp.getGlobal = function(t) {
    t = ["object" == typeof globalThis && globalThis, t, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global];
    for (var e = 0; e < t.length; ++e) {
        var n = t[e];
        if (n && n.Math == Math) return n
    }
    throw Error("Cannot find global object")
}, $jscomp.global = $jscomp.getGlobal(this), $jscomp.IS_SYMBOL_NATIVE = "function" == typeof Symbol && "symbol" == typeof Symbol("x"), $jscomp.TRUST_ES6_POLYFILLS = !$jscomp.ISOLATE_POLYFILLS || $jscomp.IS_SYMBOL_NATIVE, $jscomp.polyfills = {}, $jscomp.propertyToPolyfillSymbol = {}, $jscomp.POLYFILL_PREFIX = "$jscp$";
var $jscomp$lookupPolyfilledValue = function(t, e) {
    var n = $jscomp.propertyToPolyfillSymbol[e];
    return null != n && void 0 !== (n = t[n]) ? n : t[e]
};
$jscomp.polyfill = function(t, e, n, o) {
        e && ($jscomp.ISOLATE_POLYFILLS ? $jscomp.polyfillIsolated(t, e, n, o) : $jscomp.polyfillUnisolated(t, e, n, o))
    }, $jscomp.polyfillUnisolated = function(t, e, n, o) {
        for (n = $jscomp.global, t = t.split("."), o = 0; o < t.length - 1; o++) {
            var r = t[o];
            if (!(r in n)) return;
            n = n[r]
        }(e = e(o = n[t = t[t.length - 1]])) != o && null != e && $jscomp.defineProperty(n, t, {
            configurable: !0,
            writable: !0,
            value: e
        })
    }, $jscomp.polyfillIsolated = function(t, e, n, o) {
        var r = t.split(".");
        t = 1 === r.length, o = r[0], o = !t && o in $jscomp.polyfills ? $jscomp.polyfills : $jscomp.global;
        for (var a = 0; a < r.length - 1; a++) {
            var i = r[a];
            if (!(i in o)) return;
            o = o[i]
        }
        r = r[r.length - 1], null != (e = e(n = $jscomp.IS_SYMBOL_NATIVE && "es6" === n ? o[r] : null)) && (t ? $jscomp.defineProperty($jscomp.polyfills, r, {
            configurable: !0,
            writable: !0,
            value: e
        }) : e !== n && (void 0 === $jscomp.propertyToPolyfillSymbol[r] && (n = 1e9 * Math.random() >>> 0, $jscomp.propertyToPolyfillSymbol[r] = $jscomp.IS_SYMBOL_NATIVE ? $jscomp.global.Symbol(r) : $jscomp.POLYFILL_PREFIX + n + "$" + r), $jscomp.defineProperty(o, $jscomp.propertyToPolyfillSymbol[r], {
            configurable: !0,
            writable: !0,
            value: e
        })))
    }, $jscomp.initSymbol = function() {}, $jscomp.polyfill("Symbol", function(t) {
        if (t) return t;

        function e(t, e) {
            this.$jscomp$symbol$id_ = t, $jscomp.defineProperty(this, "description", {
                configurable: !0,
                writable: !0,
                value: e
            })
        }
        e.prototype.toString = function() {
            return this.$jscomp$symbol$id_
        };
        var n = "jscomp_symbol_" + (1e9 * Math.random() >>> 0) + "_",
            o = 0,
            r = function(t) {
                if (this instanceof r) throw new TypeError("Symbol is not a constructor");
                return new e(n + (t || "") + "_" + o++, t)
            };
        return r
    }, "es6", "es3"), $jscomp.polyfill("Symbol.iterator", function(t) {
        if (t) return t;
        t = Symbol("Symbol.iterator");
        for (var e = "Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "), n = 0; n < e.length; n++) {
            var o = $jscomp.global[e[n]];
            "function" == typeof o && "function" != typeof o.prototype[t] && $jscomp.defineProperty(o.prototype, t, {
                configurable: !0,
                writable: !0,
                value: function() {
                    return $jscomp.iteratorPrototype($jscomp.arrayIteratorImpl(this))
                }
            })
        }
        return t
    }, "es6", "es3"), $jscomp.iteratorPrototype = function(t) {
        return (t = {
            next: t
        })[Symbol.iterator] = function() {
            return this
        }, t
    }, $jscomp.makeIterator = function(t) {
        var e = "undefined" != typeof Symbol && Symbol.iterator && t[Symbol.iterator];
        return e ? e.call(t) : $jscomp.arrayIterator(t)
    }, $jscomp.polyfill("Promise", function(t) {
        function e() {
            this.batch_ = null
        }

        function i(n) {
            return n instanceof l ? n : new l(function(t, e) {
                t(n)
            })
        }
        if (t && (!($jscomp.FORCE_POLYFILL_PROMISE || $jscomp.FORCE_POLYFILL_PROMISE_WHEN_NO_UNHANDLED_REJECTION && void 0 === $jscomp.global.PromiseRejectionEvent) || !$jscomp.global.Promise || -1 === $jscomp.global.Promise.toString().indexOf("[native code]"))) return t;
        e.prototype.asyncExecute = function(t) {
            var e;
            null == this.batch_ && (this.batch_ = [], (e = this).asyncExecuteFunction(function() {
                e.executeBatch_()
            })), this.batch_.push(t)
        };
        var n = $jscomp.global.setTimeout;
        e.prototype.asyncExecuteFunction = function(t) {
            n(t, 0)
        }, e.prototype.executeBatch_ = function() {
            for (; this.batch_ && this.batch_.length;) {
                var t = this.batch_;
                this.batch_ = [];
                for (var e = 0; e < t.length; ++e) {
                    var n = t[e];
                    t[e] = null;
                    try {
                        n()
                    } catch (t) {
                        this.asyncThrow_(t)
                    }
                }
            }
            this.batch_ = null
        }, e.prototype.asyncThrow_ = function(t) {
            this.asyncExecuteFunction(function() {
                throw t
            })
        };

        function l(t) {
            this.state_ = 0, this.result_ = void 0, this.onSettledCallbacks_ = [], this.isRejectionHandled_ = !1;
            var e = this.createResolveAndReject_();
            try {
                t(e.resolve, e.reject)
            } catch (t) {
                e.reject(t)
            }
        }
        l.prototype.createResolveAndReject_ = function() {
            function t(e) {
                return function(t) {
                    o || (o = !0, e.call(n, t))
                }
            }
            var n = this,
                o = !1;
            return {
                resolve: t(this.resolveTo_),
                reject: t(this.reject_)
            }
        }, l.prototype.resolveTo_ = function(t) {
            if (t === this) this.reject_(new TypeError("A Promise cannot resolve to itself"));
            else if (t instanceof l) this.settleSameAsPromise_(t);
            else {
                t: switch (typeof t) {
                    case "object":
                        var e = null != t;
                        break t;
                    case "function":
                        e = !0;
                        break t;
                    default:
                        e = !1
                }
                e ? this.resolveToNonPromiseObj_(t) : this.fulfill_(t)
            }
        }, l.prototype.resolveToNonPromiseObj_ = function(t) {
            var e = void 0;
            try {
                e = t.then
            } catch (t) {
                return void this.reject_(t)
            }
            "function" == typeof e ? this.settleSameAsThenable_(e, t) : this.fulfill_(t)
        }, l.prototype.reject_ = function(t) {
            this.settle_(2, t)
        }, l.prototype.fulfill_ = function(t) {
            this.settle_(1, t)
        }, l.prototype.settle_ = function(t, e) {
            if (0 != this.state_) throw Error("Cannot settle(" + t + ", " + e + "): Promise already settled in state" + this.state_);
            this.state_ = t, this.result_ = e, 2 === this.state_ && this.scheduleUnhandledRejectionCheck_(), this.executeOnSettledCallbacks_()
        }, l.prototype.scheduleUnhandledRejectionCheck_ = function() {
            var e = this;
            n(function() {
                var t;
                !e.notifyUnhandledRejection_() || void 0 !== (t = $jscomp.global.console) && t.error(e.result_)
            }, 1)
        }, l.prototype.notifyUnhandledRejection_ = function() {
            if (this.isRejectionHandled_) return !1;
            var t = $jscomp.global.CustomEvent,
                e = $jscomp.global.Event,
                n = $jscomp.global.dispatchEvent;
            return void 0 === n || ("function" == typeof t ? t = new t("unhandledrejection", {
                cancelable: !0
            }) : "function" == typeof e ? t = new e("unhandledrejection", {
                cancelable: !0
            }) : (t = $jscomp.global.document.createEvent("CustomEvent")).initCustomEvent("unhandledrejection", !1, !0, t), t.promise = this, t.reason = this.result_, n(t))
        }, l.prototype.executeOnSettledCallbacks_ = function() {
            if (null != this.onSettledCallbacks_) {
                for (var t = 0; t < this.onSettledCallbacks_.length; ++t) r.asyncExecute(this.onSettledCallbacks_[t]);
                this.onSettledCallbacks_ = null
            }
        };
        var r = new e;
        return l.prototype.settleSameAsPromise_ = function(t) {
            var e = this.createResolveAndReject_();
            t.callWhenSettled_(e.resolve, e.reject)
        }, l.prototype.settleSameAsThenable_ = function(t, e) {
            var n = this.createResolveAndReject_();
            try {
                t.call(e, n.resolve, n.reject)
            } catch (t) {
                n.reject(t)
            }
        }, l.prototype.then = function(t, e) {
            function n(e, t) {
                return "function" == typeof e ? function(t) {
                    try {
                        o(e(t))
                    } catch (t) {
                        r(t)
                    }
                } : t
            }
            var o, r, a = new l(function(t, e) {
                o = t, r = e
            });
            return this.callWhenSettled_(n(t, o), n(e, r)), a
        }, l.prototype.catch = function(t) {
            return this.then(void 0, t)
        }, l.prototype.callWhenSettled_ = function(t, e) {
            function n() {
                switch (o.state_) {
                    case 1:
                        t(o.result_);
                        break;
                    case 2:
                        e(o.result_);
                        break;
                    default:
                        throw Error("Unexpected state: " + o.state_)
                }
            }
            var o = this;
            null == this.onSettledCallbacks_ ? r.asyncExecute(n) : this.onSettledCallbacks_.push(n), this.isRejectionHandled_ = !0
        }, l.resolve = i, l.reject = function(n) {
            return new l(function(t, e) {
                e(n)
            })
        }, l.race = function(r) {
            return new l(function(t, e) {
                for (var n = $jscomp.makeIterator(r), o = n.next(); !o.done; o = n.next()) i(o.value).callWhenSettled_(t, e)
            })
        }, l.all = function(t) {
            var e = $jscomp.makeIterator(t),
                a = e.next();
            return a.done ? i([]) : new l(function(n, t) {
                for (var o = [], r = 0; o.push(void 0), r++, i(a.value).callWhenSettled_(function(e) {
                        return function(t) {
                            o[e] = t, 0 == --r && n(o)
                        }
                    }(o.length - 1), t), !(a = e.next()).done;);
            })
        }, l
    }, "es6", "es3"), $jscomp.findInternal = function(t, e, n) {
        for (var o = (t = t instanceof String ? String(t) : t).length, r = 0; r < o; r++) {
            var a = t[r];
            if (e.call(n, a, r, t)) return {
                i: r,
                v: a
            }
        }
        return {
            i: -1,
            v: void 0
        }
    }, $jscomp.polyfill("Array.prototype.find", function(t) {
        return t || function(t, e) {
            return $jscomp.findInternal(this, t, e).v
        }
    }, "es6", "es3"), $jscomp.checkStringArgs = function(t, e, n) {
        if (null == t) throw new TypeError("The 'this' value for String.prototype." + n + " must not be null or undefined");
        if (e instanceof RegExp) throw new TypeError("First argument to String.prototype." + n + " must not be a regular expression");
        return t + ""
    }, $jscomp.polyfill("String.prototype.repeat", function(t) {
        return t || function(t) {
            var e = $jscomp.checkStringArgs(this, null, "repeat");
            if (t < 0 || 1342177279 < t) throw new RangeError("Invalid count value");
            t |= 0;
            for (var n = ""; t;) 1 & t && (n += e), (t >>>= 1) && (e += e);
            return n
        }
    }, "es6", "es3"), $jscomp.polyfill("Array.from", function(t) {
        return t || function(t, e, n) {
            e = null != e ? e : function(t) {
                return t
            };
            var o = [],
                r = "undefined" != typeof Symbol && Symbol.iterator && t[Symbol.iterator];
            if ("function" == typeof r) {
                t = r.call(t);
                for (var a = 0; !(r = t.next()).done;) o.push(e.call(n, r.value, a++))
            } else
                for (r = t.length, a = 0; a < r; a++) o.push(e.call(n, t[a], a));
            return o
        }
    }, "es6", "es3"), angular.module("app", "ngRoute ngAnimate app.config ui.bootstrap mgo-angular-wizard ui.tree ngMap ngTagsInput app.ui.ctrls app.ui.services app.controllers app.directives app.form.validation app.ui.form.ctrls app.ui.form.directives app.map countTo ngDragDrop".split(" ")).run(["$rootScope", "$location", "loggit", "aP", "UF", "$http", function(o, e, t, n, r, a) {
        o.$on("$routeChangeStart", function(t) {
            r.gF(), n.iLI() || e.path("/pages/signup")
        }), o.$on("$routeChangeSuccess", function(t, e, n) {
            e.hasOwnProperty("$$route") && (o.title = e.$$route.title)
        }), $(document).ready(function() {
            setTimeout(function() {
                $(".page-loading-overlay").addClass("loaded"), $(".load_circle_wrapper").addClass("loaded")
            }, 1e3)
        })
    }]).config(["$sceDelegateProvider", function(t) {
        t.trustedResourceUrlList(["self", "https://dhcxzil.facecast.xyz/**"]), t.bannedResourceUrlList(["http://myapp.example.com/clickThru**"])
    }]).config(["$routeProvider", function(t) {
        return t.when("/", {
            redirectTo: "/dashboard"
        }).when("/dashboard", {
            templateUrl: "app/views/dashboards/dashboard.html",
            title: "Dashboard"
        }).when("/dashboard/dashboard", {
            templateUrl: "app/views/dashboards/dashboard.html"
        }).when("/broadcaster/:userId/:liveId?", {
            templateUrl: "app/views/pages/broadcaster.html"
        }).when("/follower/:userId", {
            templateUrl: "app/views/pages/follower.html"
        }).when("/broadcasts/:roomType", {
            templateUrl: "app/views/pages/broadcasts.html"
        }).when("/favorites", {
            templateUrl: "app/views/pages/favorites.html"
        }).when("/pages/profile", {
            templateUrl: "app/views/pages/profile.html"
        }).when("/pages/signup", {
            templateUrl: "app/views/pages/signup.html"
        }).when("/404", {
            templateUrl: "app/views/pages/404.html"
        }).when("/pages/500", {
            templateUrl: "app/views/pages/500.html"
        }).otherwise({
            redirectTo: "/404"
        })
    }]), angular.module("app.map", []).directive("uiJqvmap", [function() {
        return {
            restrict: "A",
            scope: {
                options: "="
            },
            link: function(t, e) {
                return t = t.options, e.vectorMap(t)
            }
        }
    }]).controller("jqvmapCtrl", ["$scope", function(t) {
        var e = {
            af: "16.63",
            al: "11.58",
            dz: "158.97",
            ao: "85.81",
            ag: "1.1",
            ar: "351.02",
            am: "8.83",
            au: "1219.72",
            at: "366.26",
            az: "52.17",
            bs: "7.54",
            bh: "21.73",
            bd: "105.4",
            bb: "3.96",
            by: "52.89",
            be: "461.33",
            bz: "1.43",
            bj: "6.49",
            bt: "1.4",
            bo: "19.18",
            ba: "16.2",
            bw: "12.5",
            br: "2023.53",
            bn: "11.96",
            bg: "44.84",
            bf: "8.67",
            bi: "1.47",
            kh: "11.36",
            cm: "21.88",
            ca: "1563.66",
            cv: "1.57",
            cf: "2.11",
            td: "7.59",
            cl: "199.18",
            cn: "5745.13",
            co: "283.11",
            km: "0.56",
            cd: "12.6",
            cg: "11.88",
            cr: "35.02",
            ci: "22.38",
            hr: "59.92",
            cy: "22.75",
            cz: "195.23",
            dk: "304.56",
            dj: "1.14",
            dm: "0.38",
            do: "50.87",
            ec: "61.49",
            eg: "216.83",
            sv: "21.8",
            gq: "14.55",
            er: "2.25",
            ee: "19.22",
            et: "30.94",
            fj: "3.15",
            fi: "231.98",
            fr: "2555.44",
            ga: "12.56",
            gm: "1.04",
            ge: "11.23",
            de: "3305.9",
            gh: "18.06",
            gr: "305.01",
            gd: "0.65",
            gt: "40.77",
            gn: "4.34",
            gw: "0.83",
            gy: "2.2",
            ht: "6.5",
            hn: "15.34",
            hk: "226.49",
            hu: "132.28",
            is: "12.77",
            in: "1430.02",
            id: "695.06",
            ir: "337.9",
            iq: "84.14",
            ie: "204.14",
            il: "201.25",
            it: "2036.69",
            jm: "13.74",
            jp: "5390.9",
            jo: "27.13",
            kz: "129.76",
            ke: "32.42",
            ki: "0.15",
            kr: "986.26",
            undefined: "5.73",
            kw: "117.32",
            kg: "4.44",
            la: "6.34",
            lv: "23.39",
            lb: "39.15",
            ls: "1.8",
            lr: "0.98",
            ly: "77.91",
            lt: "35.73",
            lu: "52.43",
            mk: "9.58",
            mg: "8.33",
            mw: "5.04",
            my: "218.95",
            mv: "1.43",
            ml: "9.08",
            mt: "7.8",
            mr: "3.49",
            mu: "9.43",
            mx: "1004.04",
            md: "5.36",
            mn: "5.81",
            me: "3.88",
            ma: "91.7",
            mz: "10.21",
            mm: "35.65",
            na: "11.45",
            np: "15.11",
            nl: "770.31",
            nz: "138",
            ni: "6.38",
            ne: "5.6",
            ng: "206.66",
            no: "413.51",
            om: "53.78",
            pk: "174.79",
            pa: "27.2",
            pg: "8.81",
            py: "17.17",
            pe: "153.55",
            ph: "189.06",
            pl: "438.88",
            pt: "223.7",
            qa: "126.52",
            ro: "158.39",
            ru: "1476.91",
            rw: "5.69",
            ws: "0.55",
            st: "0.19",
            sa: "434.44",
            sn: "12.66",
            rs: "38.92",
            sc: "0.92",
            sl: "1.9",
            sg: "217.38",
            sk: "86.26",
            si: "46.44",
            sb: "0.67",
            za: "354.41",
            es: "1374.78",
            lk: "48.24",
            kn: "0.56",
            lc: "1",
            vc: "0.58",
            sd: "65.93",
            sr: "3.3",
            sz: "3.17",
            se: "444.59",
            ch: "522.44",
            sy: "59.63",
            tw: "426.98",
            tj: "5.58",
            tz: "22.43",
            th: "312.61",
            tl: "0.62",
            tg: "3.07",
            to: "0.3",
            tt: "21.2",
            tn: "43.86",
            tr: "729.05",
            tm: 0,
            ug: "17.12",
            ua: "136.56",
            ae: "239.65",
            gb: "2258.57",
            us: "14624.18",
            uy: "40.71",
            uz: "37.72",
            vu: "0.72",
            ve: "285.21",
            vn: "101.99",
            ye: "30.02",
            zm: "15.69",
            zw: "5.57"
        };
        return t.worldMap = {
            map: "world_en",
            backgroundColor: null,
            color: "#ffffff",
            hoverOpacity: .7,
            selectedColor: "#db5031",
            hoverColor: "#db5031",
            enableZoom: !0,
            showTooltip: !0,
            values: e,
            scaleColors: ["#F1EFF0", "#c1bfc0"],
            normalizeFunction: "polynomial"
        }, t.USAMap = {
            map: "usa_en",
            backgroundColor: null,
            color: "#ffffff",
            selectedColor: "#db5031",
            hoverColor: "#db5031",
            enableZoom: !0,
            showTooltip: !0,
            selectedRegion: "MO"
        }, t.europeMap = {
            map: "europe_en",
            backgroundColor: null,
            color: "#ffffff",
            hoverOpacity: .7,
            selectedColor: "#db5031",
            hoverColor: "#db5031",
            enableZoom: !0,
            showTooltip: !0,
            values: e,
            scaleColors: ["#F1EFF0", "#c1bfc0"],
            normalizeFunction: "polynomial"
        }
    }]), angular.module("countTo", []).controller("countTo", ["$scope", function(t) {
        return t.countersmall1 = {
            countTo: 20,
            countFrom: 0
        }, t.countersmall2 = {
            countTo: 42,
            countFrom: 0
        }, t.countersmall3 = {
            countTo: 90,
            countFrom: 0
        }, t.countersmall1dash = {
            countTo: 420,
            countFrom: 0
        }, t.countersmall2dash = {
            countTo: 742,
            countFrom: 0
        }, t.countersmall3dash = {
            countTo: 100,
            countFrom: 0
        }
    }]).directive("countTo", ["$timeout", function(d) {
        return {
            replace: !1,
            scope: !0,
            link: function(t, e, n) {
                function o() {
                    t.timoutId && d.cancel(t.timoutId), a = 30, s = 0, t.timoutId = null, c = parseInt(n.countTo) || 0, t.value = parseInt(n.value, 10) || 0, i = 1e3 * parseFloat(n.duration) || 0, l = Math.ceil(i / a), u = (c - t.value) / l, r = t.value, p()
                }
                var r, a, i, l, s, c, u, f = e[0],
                    p = function() {
                        t.timoutId = d(function() {
                            r += u, l <= ++s ? (d.cancel(t.timoutId), r = c, f.textContent = c) : (f.textContent = Math.round(r), p())
                        }, a)
                    };
                return n.$observe("countTo", function(t) {
                    t && o()
                }), n.$observe("value", function(t) {
                    o()
                }), !0
            }
        }
    }]), angular.module("app.config", []).constant("const", []),
    function() {
        var x = x || {};
        x.scope = {}, x.ASSUME_ES5 = !1, x.ASSUME_NO_NATIVE_MAP = !1, x.ASSUME_NO_NATIVE_SET = !1, x.SIMPLE_FROUND_POLYFILL = !1, x.ISOLATE_POLYFILLS = !1, x.FORCE_POLYFILL_PROMISE = !1, x.FORCE_POLYFILL_PROMISE_WHEN_NO_UNHANDLED_REJECTION = !1, x.defineProperty = x.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function(t, e, n) {
            return t == Array.prototype || t == Object.prototype || (t[e] = n.value), t
        }, x.getGlobal = function(t) {
            t = ["object" == typeof globalThis && globalThis, t, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global];
            for (var e = 0; e < t.length; ++e) {
                var n = t[e];
                if (n && n.Math == Math) return n
            }
            throw Error("Cannot find global object")
        }, x.global = x.getGlobal(this), x.IS_SYMBOL_NATIVE = "function" == typeof Symbol && "symbol" == typeof Symbol("x"), x.TRUST_ES6_POLYFILLS = !x.ISOLATE_POLYFILLS || x.IS_SYMBOL_NATIVE, x.polyfills = {}, x.propertyToPolyfillSymbol = {}, x.POLYFILL_PREFIX = "$jscp$", x.polyfill = function(t, e, n, o) {
            e && (x.ISOLATE_POLYFILLS ? x.polyfillIsolated(t, e, n, o) : x.polyfillUnisolated(t, e, n, o))
        }, x.polyfillUnisolated = function(t, e, n, o) {
            for (n = x.global, t = t.split("."), o = 0; o < t.length - 1; o++) {
                var r = t[o];
                if (!(r in n)) return;
                n = n[r]
            }(e = e(o = n[t = t[t.length - 1]])) != o && null != e && x.defineProperty(n, t, {
                configurable: !0,
                writable: !0,
                value: e
            })
        }, x.polyfillIsolated = function(t, e, n, o) {
            var r = t.split(".");
            t = 1 === r.length, o = r[0], o = !t && o in x.polyfills ? x.polyfills : x.global;
            for (var a = 0; a < r.length - 1; a++) {
                var i = r[a];
                if (!(i in o)) return;
                o = o[i]
            }
            r = r[r.length - 1], null != (e = e(n = x.IS_SYMBOL_NATIVE && "es6" === n ? o[r] : null)) && (t ? x.defineProperty(x.polyfills, r, {
                configurable: !0,
                writable: !0,
                value: e
            }) : e !== n && (void 0 === x.propertyToPolyfillSymbol[r] && (n = 1e9 * Math.random() >>> 0, x.propertyToPolyfillSymbol[r] = x.IS_SYMBOL_NATIVE ? x.global.Symbol(r) : x.POLYFILL_PREFIX + n + "$" + r), x.defineProperty(o, x.propertyToPolyfillSymbol[r], {
                configurable: !0,
                writable: !0,
                value: e
            })))
        }, x.underscoreProtoCanBeSet = function() {
            var t = {};
            try {
                return t.__proto__ = {
                    a: !0
                }, t.a
            } catch (t) {}
            return !1
        }, x.setPrototypeOf = x.TRUST_ES6_POLYFILLS && "function" == typeof Object.setPrototypeOf ? Object.setPrototypeOf : x.underscoreProtoCanBeSet() ? function(t, e) {
            if (t.__proto__ = e, t.__proto__ !== e) throw new TypeError(t + " is not extensible");
            return t
        } : null, x.arrayIteratorImpl = function(t) {
            var e = 0;
            return function() {
                return e < t.length ? {
                    done: !1,
                    value: t[e++]
                } : {
                    done: !0
                }
            }
        }, x.arrayIterator = function(t) {
            return {
                next: x.arrayIteratorImpl(t)
            }
        }, x.makeIterator = function(t) {
            var e = "undefined" != typeof Symbol && Symbol.iterator && t[Symbol.iterator];
            return e ? e.call(t) : x.arrayIterator(t)
        }, x.generator = {}, x.generator.ensureIteratorResultIsObject_ = function(t) {
            if (!(t instanceof Object)) throw new TypeError("Iterator result " + t + " is not an object")
        }, x.generator.Context = function() {
            this.isRunning_ = !1, this.yieldAllIterator_ = null, this.yieldResult = void 0, this.nextAddress = 1, this.finallyAddress_ = this.catchAddress_ = 0, this.finallyContexts_ = this.abruptCompletion_ = null
        }, x.generator.Context.prototype.start_ = function() {
            if (this.isRunning_) throw new TypeError("Generator is already running");
            this.isRunning_ = !0
        }, x.generator.Context.prototype.stop_ = function() {
            this.isRunning_ = !1
        }, x.generator.Context.prototype.jumpToErrorHandler_ = function() {
            this.nextAddress = this.catchAddress_ || this.finallyAddress_
        }, x.generator.Context.prototype.next_ = function(t) {
            this.yieldResult = t
        }, x.generator.Context.prototype.throw_ = function(t) {
            this.abruptCompletion_ = {
                exception: t,
                isException: !0
            }, this.jumpToErrorHandler_()
        }, x.generator.Context.prototype.return = function(t) {
            this.abruptCompletion_ = {
                return: t
            }, this.nextAddress = this.finallyAddress_
        }, x.generator.Context.prototype.jumpThroughFinallyBlocks = function(t) {
            this.abruptCompletion_ = {
                jumpTo: t
            }, this.nextAddress = this.finallyAddress_
        }, x.generator.Context.prototype.yield = function(t, e) {
            return this.nextAddress = e, {
                value: t
            }
        }, x.generator.Context.prototype.yieldAll = function(t, e) {
            var n = (t = x.makeIterator(t)).next();
            if (x.generator.ensureIteratorResultIsObject_(n), !n.done) return this.yieldAllIterator_ = t, this.yield(n.value, e);
            this.yieldResult = n.value, this.nextAddress = e
        }, x.generator.Context.prototype.jumpTo = function(t) {
            this.nextAddress = t
        }, x.generator.Context.prototype.jumpToEnd = function() {
            this.nextAddress = 0
        }, x.generator.Context.prototype.setCatchFinallyBlocks = function(t, e) {
            this.catchAddress_ = t, null != e && (this.finallyAddress_ = e)
        }, x.generator.Context.prototype.setFinallyBlock = function(t) {
            this.catchAddress_ = 0, this.finallyAddress_ = t || 0
        }, x.generator.Context.prototype.leaveTryBlock = function(t, e) {
            this.nextAddress = t, this.catchAddress_ = e || 0
        }, x.generator.Context.prototype.enterCatchBlock = function(t) {
            return this.catchAddress_ = t || 0, t = this.abruptCompletion_.exception, this.abruptCompletion_ = null, t
        }, x.generator.Context.prototype.enterFinallyBlock = function(t, e, n) {
            n ? this.finallyContexts_[n] = this.abruptCompletion_ : this.finallyContexts_ = [this.abruptCompletion_], this.catchAddress_ = t || 0, this.finallyAddress_ = e || 0
        }, x.generator.Context.prototype.leaveFinallyBlock = function(t, e) {
            if (e = this.finallyContexts_.splice(e || 0)[0], e = this.abruptCompletion_ = this.abruptCompletion_ || e) {
                if (e.isException) return this.jumpToErrorHandler_();
                null != e.jumpTo && this.finallyAddress_ < e.jumpTo ? (this.nextAddress = e.jumpTo, this.abruptCompletion_ = null) : this.nextAddress = this.finallyAddress_
            } else this.nextAddress = t
        }, x.generator.Context.prototype.forIn = function(t) {
            return new x.generator.Context.PropertyIterator(t)
        }, x.generator.Context.PropertyIterator = function(t) {
            for (var e in this.object_ = t, this.properties_ = [], t) this.properties_.push(e);
            this.properties_.reverse()
        }, x.generator.Context.PropertyIterator.prototype.getNext = function() {
            for (; 0 < this.properties_.length;) {
                var t = this.properties_.pop();
                if (t in this.object_) return t
            }
            return null
        }, x.generator.Engine_ = function(t) {
            this.context_ = new x.generator.Context, this.program_ = t
        }, x.generator.Engine_.prototype.next_ = function(t) {
            return this.context_.start_(), this.context_.yieldAllIterator_ ? this.yieldAllStep_(this.context_.yieldAllIterator_.next, t, this.context_.next_) : (this.context_.next_(t), this.nextStep_())
        }, x.generator.Engine_.prototype.return_ = function(t) {
            this.context_.start_();
            var e = this.context_.yieldAllIterator_;
            return e ? this.yieldAllStep_("return" in e ? e.return : function(t) {
                return {
                    value: t,
                    done: !0
                }
            }, t, this.context_.return) : (this.context_.return(t), this.nextStep_())
        }, x.generator.Engine_.prototype.throw_ = function(t) {
            return this.context_.start_(), this.context_.yieldAllIterator_ ? this.yieldAllStep_(this.context_.yieldAllIterator_.throw, t, this.context_.next_) : (this.context_.throw_(t), this.nextStep_())
        }, x.generator.Engine_.prototype.yieldAllStep_ = function(t, e, n) {
            try {
                var o = t.call(this.context_.yieldAllIterator_, e);
                if (x.generator.ensureIteratorResultIsObject_(o), !o.done) return this.context_.stop_(), o;
                var r = o.value
            } catch (t) {
                return this.context_.yieldAllIterator_ = null, this.context_.throw_(t), this.nextStep_()
            }
            return this.context_.yieldAllIterator_ = null, n.call(this.context_, r), this.nextStep_()
        }, x.generator.Engine_.prototype.nextStep_ = function() {
            for (; this.context_.nextAddress;) try {
                var t = this.program_(this.context_);
                if (t) return this.context_.stop_(), {
                    value: t.value,
                    done: !1
                }
            } catch (t) {
                this.context_.yieldResult = void 0, this.context_.throw_(t)
            }
            if (this.context_.stop_(), this.context_.abruptCompletion_) {
                if (t = this.context_.abruptCompletion_, this.context_.abruptCompletion_ = null, t.isException) throw t.exception;
                return {
                    value: t.return,
                    done: !0
                }
            }
            return {
                value: void 0,
                done: !0
            }
        }, x.generator.Generator_ = function(e) {
            this.next = function(t) {
                return e.next_(t)
            }, this.throw = function(t) {
                return e.throw_(t)
            }, this.return = function(t) {
                return e.return_(t)
            }, this[Symbol.iterator] = function() {
                return this
            }
        }, x.generator.createGenerator = function(t, e) {
            return e = new x.generator.Generator_(new x.generator.Engine_(e)), x.setPrototypeOf && t.prototype && x.setPrototypeOf(e, t.prototype), e
        }, x.asyncExecutePromiseGenerator = function(e) {
            function r(t) {
                return e.next(t)
            }

            function a(t) {
                return e.throw(t)
            }
            return new Promise(function(n, o) {
                ! function t(e) {
                    e.done ? n(e.value) : Promise.resolve(e.value).then(r, a).then(t, o)
                }(e.next())
            })
        }, x.asyncExecutePromiseGeneratorFunction = function(t) {
            return x.asyncExecutePromiseGenerator(t())
        }, x.asyncExecutePromiseGeneratorProgram = function(t) {
            return x.asyncExecutePromiseGenerator(new x.generator.Generator_(new x.generator.Engine_(t)))
        }, x.initSymbol = function() {}, x.polyfill("Symbol", function(t) {
            function e(t, e) {
                this.$jscomp$symbol$id_ = t, x.defineProperty(this, "description", {
                    configurable: !0,
                    writable: !0,
                    value: e
                })
            }
            if (t) return t;
            e.prototype.toString = function() {
                return this.$jscomp$symbol$id_
            };
            var n = "jscomp_symbol_" + (1e9 * Math.random() >>> 0) + "_",
                o = 0,
                r = function(t) {
                    if (this instanceof r) throw new TypeError("Symbol is not a constructor");
                    return new e(n + (t || "") + "_" + o++, t)
                };
            return r
        }, "es6", "es3"), x.polyfill("Symbol.iterator", function(t) {
            if (t) return t;
            t = Symbol("Symbol.iterator");
            for (var e = "Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "), n = 0; n < e.length; n++) {
                var o = x.global[e[n]];
                "function" == typeof o && "function" != typeof o.prototype[t] && x.defineProperty(o.prototype, t, {
                    configurable: !0,
                    writable: !0,
                    value: function() {
                        return x.iteratorPrototype(x.arrayIteratorImpl(this))
                    }
                })
            }
            return t
        }, "es6", "es3"), x.iteratorPrototype = function(t) {
            return (t = {
                next: t
            })[Symbol.iterator] = function() {
                return this
            }, t
        }, x.polyfill("Promise", function(t) {
            function e() {
                this.batch_ = null
            }

            function i(n) {
                return n instanceof l ? n : new l(function(t, e) {
                    t(n)
                })
            }

            function l(t) {
                this.state_ = 0, this.result_ = void 0, this.onSettledCallbacks_ = [], this.isRejectionHandled_ = !1;
                var e = this.createResolveAndReject_();
                try {
                    t(e.resolve, e.reject)
                } catch (t) {
                    e.reject(t)
                }
            }
            if (t && (!(x.FORCE_POLYFILL_PROMISE || x.FORCE_POLYFILL_PROMISE_WHEN_NO_UNHANDLED_REJECTION && void 0 === x.global.PromiseRejectionEvent) || !x.global.Promise || -1 === x.global.Promise.toString().indexOf("[native code]"))) return t;
            e.prototype.asyncExecute = function(t) {
                var e;
                null == this.batch_ && (this.batch_ = [], (e = this).asyncExecuteFunction(function() {
                    e.executeBatch_()
                })), this.batch_.push(t)
            };
            var n = x.global.setTimeout;
            e.prototype.asyncExecuteFunction = function(t) {
                n(t, 0)
            }, e.prototype.executeBatch_ = function() {
                for (; this.batch_ && this.batch_.length;) {
                    var t = this.batch_;
                    this.batch_ = [];
                    for (var e = 0; e < t.length; ++e) {
                        var n = t[e];
                        t[e] = null;
                        try {
                            n()
                        } catch (t) {
                            this.asyncThrow_(t)
                        }
                    }
                }
                this.batch_ = null
            }, e.prototype.asyncThrow_ = function(t) {
                this.asyncExecuteFunction(function() {
                    throw t
                })
            }, l.prototype.createResolveAndReject_ = function() {
                function t(e) {
                    return function(t) {
                        o || (o = !0, e.call(n, t))
                    }
                }
                var n = this,
                    o = !1;
                return {
                    resolve: t(this.resolveTo_),
                    reject: t(this.reject_)
                }
            }, l.prototype.resolveTo_ = function(t) {
                if (t === this) this.reject_(new TypeError("A Promise cannot resolve to itself"));
                else if (t instanceof l) this.settleSameAsPromise_(t);
                else {
                    t: switch (typeof t) {
                        case "object":
                            var e = null != t;
                            break t;
                        case "function":
                            e = !0;
                            break t;
                        default:
                            e = !1
                    }
                    e ? this.resolveToNonPromiseObj_(t) : this.fulfill_(t)
                }
            }, l.prototype.resolveToNonPromiseObj_ = function(t) {
                var e = void 0;
                try {
                    e = t.then
                } catch (t) {
                    return void this.reject_(t)
                }
                "function" == typeof e ? this.settleSameAsThenable_(e, t) : this.fulfill_(t)
            }, l.prototype.reject_ = function(t) {
                this.settle_(2, t)
            }, l.prototype.fulfill_ = function(t) {
                this.settle_(1, t)
            }, l.prototype.settle_ = function(t, e) {
                if (0 != this.state_) throw Error("Cannot settle(" + t + ", " + e + "): Promise already settled in state" + this.state_);
                this.state_ = t, this.result_ = e, 2 === this.state_ && this.scheduleUnhandledRejectionCheck_(), this.executeOnSettledCallbacks_()
            }, l.prototype.scheduleUnhandledRejectionCheck_ = function() {
                var e = this;
                n(function() {
                    var t;
                    !e.notifyUnhandledRejection_() || void 0 !== (t = x.global.console) && t.error(e.result_)
                }, 1)
            }, l.prototype.notifyUnhandledRejection_ = function() {
                if (this.isRejectionHandled_) return !1;
                var t = x.global.CustomEvent,
                    e = x.global.Event,
                    n = x.global.dispatchEvent;
                return void 0 === n || ("function" == typeof t ? t = new t("unhandledrejection", {
                    cancelable: !0
                }) : "function" == typeof e ? t = new e("unhandledrejection", {
                    cancelable: !0
                }) : (t = x.global.document.createEvent("CustomEvent")).initCustomEvent("unhandledrejection", !1, !0, t), t.promise = this, t.reason = this.result_, n(t))
            }, l.prototype.executeOnSettledCallbacks_ = function() {
                if (null != this.onSettledCallbacks_) {
                    for (var t = 0; t < this.onSettledCallbacks_.length; ++t) r.asyncExecute(this.onSettledCallbacks_[t]);
                    this.onSettledCallbacks_ = null
                }
            };
            var r = new e;
            return l.prototype.settleSameAsPromise_ = function(t) {
                var e = this.createResolveAndReject_();
                t.callWhenSettled_(e.resolve, e.reject)
            }, l.prototype.settleSameAsThenable_ = function(t, e) {
                var n = this.createResolveAndReject_();
                try {
                    t.call(e, n.resolve, n.reject)
                } catch (t) {
                    n.reject(t)
                }
            }, l.prototype.then = function(t, e) {
                function n(e, t) {
                    return "function" == typeof e ? function(t) {
                        try {
                            o(e(t))
                        } catch (t) {
                            r(t)
                        }
                    } : t
                }
                var o, r, a = new l(function(t, e) {
                    o = t, r = e
                });
                return this.callWhenSettled_(n(t, o), n(e, r)), a
            }, l.prototype.catch = function(t) {
                return this.then(void 0, t)
            }, l.prototype.callWhenSettled_ = function(t, e) {
                function n() {
                    switch (o.state_) {
                        case 1:
                            t(o.result_);
                            break;
                        case 2:
                            e(o.result_);
                            break;
                        default:
                            throw Error("Unexpected state: " + o.state_)
                    }
                }
                var o = this;
                null == this.onSettledCallbacks_ ? r.asyncExecute(n) : this.onSettledCallbacks_.push(n), this.isRejectionHandled_ = !0
            }, l.resolve = i, l.reject = function(n) {
                return new l(function(t, e) {
                    e(n)
                })
            }, l.race = function(r) {
                return new l(function(t, e) {
                    for (var n = x.makeIterator(r), o = n.next(); !o.done; o = n.next()) i(o.value).callWhenSettled_(t, e)
                })
            }, l.all = function(t) {
                var e = x.makeIterator(t),
                    a = e.next();
                return a.done ? i([]) : new l(function(n, t) {
                    for (var o = [], r = 0; o.push(void 0), r++, i(a.value).callWhenSettled_(function(e) {
                            return function(t) {
                                o[e] = t, 0 == --r && n(o)
                            }
                        }(o.length - 1), t), !(a = e.next()).done;);
                })
            }, l
        }, "es6", "es3"), angular.module("app.controllers", []).controller("AdminAppCtrl", ["$scope", "$location", "storageService", function(n, t, o) {
            n.checkIfOwnPage = function() {
                return _.contains("/front /404 /pages/500 /pages/login /pages/signin /pages/signin1 /pages/signin2 /pages/signup /pages/signup1 /pages/signup2 /pages/forgot /pages/lock-screen".split(" "), t.path())
            }, n.checkIfFixedPage = function() {
                return _.contains(["/dashboard"], t.path())
            }, n.metadata = {
                title: "FaceCast StreamCatcher",
                description: "default description"
            }, n.$on("newPageLoaded", function(t, e) {
                n.metadata = e
            });
            var r, a = o.get("accountList") || [],
                e = o.get("aSaveList");
            e && (e.forEach(function(t, e) {
                _.findWhere(a, {
                    accountId: t
                }) || (r = {
                    accountId: t,
                    liveId: null,
                    userName: "",
                    pastStreams: [],
                    rating: 0,
                    onlyPrivate: !1,
                    isEnabled: !0
                }, a.push(r)), o.set("accountList", a)
            }), o.remove("aSaveList"))
        }]).controller("NavCtrl", ["$scope", "$rootScope", "navigationMenuService", "UF", "aP", "$location", "storageService", function(n, t, e, o, r, a, i) {
            t.$on("NewUser", function(t, e) {
                isNaN(e.userId) || "" == e.userId || null == e.userId || ("undefined" != typeof Storage && ((version = localStorage.getItem("version")) && 2 != version || o.aV(e.userId).then(function(t) {
                    localStorage.setItem("version", 2)
                })), o.gUI(e.userId).then(function(t) {
                    n.myUserInfo = t.result
                }))
            }), null == user.userId ? a.path("/pages/signup") : o.gUI(user.userId).then(function(t) {
                t && t.result && (n.myUserInfo = t.result)
            }), this.navigationState = e, this.SwitchToMenu = function() {
                e.menu = !0, e.recordings = !1
            }, this.SwitchToSecondary = function() {
                e.menu = !1, e.recordings = !0
            }, n.updateAutoRecords = function() {
                accountList = i.get("accountList") || [], n.watchList = _.where(accountList, {
                    isEnabled: !0
                })
            }, n.updateAutoRecords()
        }]), angular.module("app.form.validation", []).controller("wizardFormCtrl", ["$scope", function(t) {
            return t.wizard = {
                firstName: "some name",
                lastName: "",
                email: "",
                password: "",
                age: "",
                address: ""
            }, t.isValidateStep1 = function() {}, t.finishedWizard = function() {}
        }]).controller("formConstraintsCtrl", ["$scope", function(t) {
            var e;
            return t.form = {
                required: "",
                minlength: "",
                maxlength: "",
                length_rage: "",
                type_something: "",
                confirm_type: "",
                foo: "",
                email: "",
                url: "",
                num: "",
                minVal: "",
                maxVal: "",
                valRange: "",
                pattern: ""
            }, e = angular.copy(t.form), t.revert = function() {
                return t.form = angular.copy(e), t.form_constraints.$setPristine()
            }, t.canRevert = function() {
                return !angular.equals(t.form, e) || !t.form_constraints.$pristine
            }, t.canSubmit = function() {
                return t.form_constraints.$valid && !angular.equals(t.form, e)
            }
        }]).controller("siC", ["$scope", "aP", "$location", function(t, e, n) {
            var o;
            return t.user = {}, t.sIoS = !1, o = angular.copy(t.user), t.revert = function() {
                return t.user = angular.copy(o), t.form_signin.$setPristine()
            }, t.canRevert = function() {
                return !angular.equals(t.user, o) || !t.form_signin.$pristine
            }, t.cSt = function() {
                return t.form_signin.$valid && !angular.equals(t.user, o)
            }
        }]).controller("suC", ["$scope", "SF", "loggit", "aP", "$location", function(o, r, a, i, l) {
            var t;
            return o.$emit("newPageLoaded", {
                title: "Sign In - FaceCast StreamCatcher",
                description: "blah"
            }), o.sCB = !1, o.cS = !1, o.cCd = !1, void 0 !== o.mE && (o.sCB = !0), o.user = {}, o.lI = !1, o.sIoS = !1, t = angular.copy(o.user), o.revert = function() {
                return o.user = angular.copy(t), o.form_signup.$setPristine(), o.form_signup.confirmPassword.$setPristine()
            }, o.canRevert = function() {
                return !angular.equals(o.user, t) || !o.form_signup.$pristine
            }, o.cSt = function() {
                return o.form_signup.$valid && !angular.equals(o.user, t)
            }, o.sF = function() {
                return o.sIoS = !0, o.revert()
            }, o.sSI = function() {
                return o.lI = !0
            }, o.sSU = function() {
                return o.lI = !1
            }, o.sC = function(t) {
                r.gSC(t).then(function(t) {
                    o.UserInfo = t.result, "500" == t.code ? a.logError(t.msg) : (a.logSuccess(t.msg), o.cS = !0)
                })
            }, o.cC = function(t, e) {
                r.gCC(t, e).then(function(t) {
                    o.UserInfo = t.result, "Vertification code is corret" !== t.msg ? (a.logError(t.msg), o.cS = !1) : (t.msg = "Verification succeeded!", a.logSuccess(t.msg), o.cCd = !0)
                })
            }, o.signUp = function(t, e, n) {
                !0 === o.cCd && r.gRE(t, e, n).then(function(t) {
                    o.UserInfo = t.result, "500" == t.code ? a.logError(t.msg) : "40008" == t.code ? (a.logError("The chosen username is already taken. Choose a new one."), o.mUN = t.result.nickName) : "40003" == t.code ? a.logError("Unable to create any more accounts with this software, please contact Red Paddington to unlock") : "Signed up successdully" == t.msg ? (a.logSuccess("Account successfully created"), i.sU(t.result.userId, t.result.token), l.path("/dashboard")) : (a.logError(t.msg), o.cS = !0)
                })
            }, o.signIn = function(t, e) {
                r.gL(t, e).then(function(t) {
                    o.UserInfo = t.result, "40007" != t.code && "Login successfully" == t.msg ? (a.logSuccess("Logged in successfully"), i.sU(t.result.userId, t.result.token), l.path("/dashboard")) : a.logError(t.msg)
                })
            }
        }]).directive("validateEquals", [function() {
            return {
                require: "ngModel",
                link: function(e, t, n, o) {
                    return t = function(t) {
                        return t = t === e.$eval(n.validateEquals), o.$setValidity("equal", t), "function" == typeof t ? t({
                            value: void 0
                        }) : void 0
                    }, o.$parsers.push(t), o.$formatters.push(t), e.$watch(n.validateEquals, function(t, e) {
                        return t !== e ? o.$setViewValue(o.$ViewValue) : void 0
                    })
                }
            }
        }]), angular.module("app.ui.form.ctrls", []).controller("TagsCtrl", ["$scope", function(t) {
            t.tags = ["foo", "bar"]
        }]).controller("DatepickerCtrl", ["$scope", function(e) {
            return e.today = function() {
                e.dt = new Date
            }, e.today(), e.showWeeks = !0, e.toggleWeeks = function() {
                e.showWeeks = !e.showWeeks
            }, e.clear = function() {
                e.dt = null
            }, e.disabled = function(t, e) {
                return "day" === e && (0 === t.getDay() || 6 === t.getDay())
            }, e.toggleMin = function() {
                var t;
                e.minDate = null !== (t = e.minDate) ? t : {
                    null: new Date
                }
            }, e.toggleMin(), e.open = function(t) {
                return t.preventDefault(), t.stopPropagation(), e.opened = !0
            }, e.dateOptions = {
                "year-format": "'yy'",
                "starting-day": 1
            }, e.formats = ["dd-MMMM-yyyy", "yyyy/MM/dd", "shortDate"], e.format = e.formats[0]
        }]).controller("TimepickerCtrl", ["$scope", function(e) {
            return e.mytime = new Date, e.hstep = 1, e.mstep = 15, e.options = {
                hstep: [1, 2, 3],
                mstep: [1, 5, 10, 15, 25, 30]
            }, e.ismeridian = !0, e.toggleMode = function() {
                e.ismeridian = !e.ismeridian
            }, e.update = function() {
                var t = new Date;
                return t.setHours(14), t.setMinutes(0), e.mytime = t
            }, e.changed = function() {}, e.clear = function() {
                e.mytime = null
            }
        }]).controller("RatingCtrl", ["$scope", function(e) {
            return e.rate = 7, e.max = 10, e.isReadonly = !1, e.hoveringOver = function(t) {
                return e.overStar = t, e.percent = t / e.max * 100
            }, e.ratingStates = [{
                stateOn: "glyphicon-ok-sign",
                stateOff: "glyphicon-ok-circle"
            }, {
                stateOn: "glyphicon-star",
                stateOff: "glyphicon-star-empty"
            }, {
                stateOn: "glyphicon-heart",
                stateOff: "glyphicon-ban-circle"
            }, {
                stateOn: "glyphicon-heart"
            }, {
                stateOff: "glyphicon-off"
            }]
        }]), angular.module("app.ui.ctrls", []).controller("NotifyCtrl", ["$scope", "loggit", function(t, e) {}]).controller("BroadcastListingCtrl", ["$scope", "BLS", "$routeParams", "UF", function(e, n, o, t) {
            e.$emit("newPageLoaded", {
                title: "FaceCast StreamCatcher",
                description: "blah"
            }), t.gF().then(function(t) {
                e.BroadcastsSrv = n.b, n.gB(o.roomType, function(t) {
                    e.$apply(function() {
                        e.BroadcastsSrv = n.b, e.countries = n.b.data.map(function(t) {
                            return t.country
                        })
                    })
                }, !1)
            }), e.fullRefresh = function() {
                n.gB(o.roomType, function(t) {
                    e.$apply(function() {
                        e.BroadcastsSrv = n.b, e.countries = n.b.data.map(function(t) {
                            return t.country
                        })
                    })
                }, !0)
            }
        }]).controller("FavoriteListingCtrl", ["$scope", "FLS", "aP", "UF", function(e, n, t, o) {
            e.$emit("newPageLoaded", {
                title: "FaceCast StreamCatcher",
                description: "blah"
            }), user = t.gU(), o.gF().then(function(t) {
                e.FollowerSrv = n.f, e.userData = function(t, e) {
                    for (var n = [], o = 1; o < arguments.length; ++o) n[o - 1] = arguments[o];
                    return n.reduce(function(t, e) {
                        return t && t[e]
                    }, t)
                }(n, "f", "users", user.userId), n.gF(user.userId, function(t) {
                    e.$watch("FollowerSrv", function() {
                        e.FollowerSrv = n.f
                    }), e.$apply(function() {
                        e.userData = n.userData[user.userId]
                    })
                })
            }), e.startRefresh = function() {
                n.gF(user.userId, function(t) {
                    e.$apply(function() {
                        e.FollowerSrv = n.f, e.userData = n.userData[user.userId]
                    })
                }, !0)
            }, e.stopRefresh = function() {
                n.stopWorker(user.userId, function(t) {}, !0), e.FavoritesSrv.loading = !1, e.FavoritesSrv.progress = 100
            }, e.$on("$destroy", function() {
                n.stopWorker()
            })
        }]).controller("FollowerListingCtrl", ["$scope", "UF", "$routeParams", "FLS", "$window", "$filter", function(e, t, n, o, r, a) {
            t.gUI(n.userId).then(function(t) {
                e.UserInfo = t.result, e.$emit("newPageLoaded", {
                    title: "User " + e.UserInfo.userId + " (" + e.UserInfo.nickName + ") - FaceCast StreamCatcher",
                    description: "blah"
                })
            }), e.FollowerSrv = o.f, t = function(t, e) {
                for (var n = [], o = 1; o < arguments.length; ++o) n[o - 1] = arguments[o];
                return n.reduce(function(t, e) {
                    return t && t[e]
                }, t)
            }(o, "f", "users", n.userId), e.userData = t, e.$watch("FollowerSrv", function() {
                e.FollowerSrv = o.f
            }), o.gF(n.userId, function(t) {
                e.$apply(function() {
                    e.FollowerSrv = o.f, e.userData = o.userData[n.userId]
                })
            }), e.startRefresh = function() {
                o.gF(n.userId, function(t) {
                    e.$apply(function() {
                        e.FollowerSrv = o.f, e.userData = o.userData[n.userId]
                    })
                }, !0)
            }, e.sortButtonClick = function() {
                "ASC" === e.sortDir ? (e.sortDir = "DESC", e.userData = a("orderBy")(e.userData, "-name")) : (e.sortDir = "ASC", e.userData = a("orderBy")(e.userData, "name"))
            }, e.$on("$destroy", function() {
                o.stopWorker()
            })
        }]).controller("BroadcasterCtrl", ["$scope", "UF", "$routeParams", "$http", "$window", "BroadcasterListingSrv", "FollowerListingSrv", "loggit", "aP", "$timeout", "$location", "storageService", function(a, o, r, t, e, i, n, s, c, u, f, p) {
            function d(t) {
                return (t = document.getElementById(t)) && t.parentNode.removeChild(t)
            }

            function h(t) {
                var e = document.createElement("link"),
                    n = document.getElementById("dynamic-favicon");
                e.id = "dynamic-favicon", e.rel = "shortcut icon", e.href = t, n && document.head.removeChild(n), document.head.appendChild(e)
            }

            function m() {
                b = p.get("accountList") || [], (E = _.findWhere(b, {
                    accountId: w
                })) ? (E.liveId = v, E.userName = a.UserInfo.nickName, _.extend(_.findWhere(b, {
                    accountId: w
                }), E)) : (E = {
                    accountId: w,
                    liveId: v,
                    userName: a.UserInfo.nickName,
                    pastStreams: [],
                    rating: 0,
                    onlyPrivate: a.privateSave,
                    isEnabled: a.aFlvSave
                }, b.push(E)), p.set("accountList", b)
            }

            function y() {
                if (a.offline) {
                    switch (h("app/images/favico/offline.png"), O += 1, j = !0) {
                        case I < 20:
                            g = 20 - 10 * O;
                            break;
                        case I < 100:
                            g = 40 - 10 * O;
                            break;
                        case I < 200:
                            g = 70 - 10 * O;
                            break;
                        default:
                            g = 130 - 10 * O
                    }(a.reloadIn = g) <= 0 ? o.gLI(r.userId).then(function(t) {
                        "" == t && location.reload(), t && t.result && 3 != t.result.isLive ? o.cS(t.result.hlsUrl).then(function(t) {
                            0 == t ? (O = 0, I++, S = u(y, 1e4)) : location.reload()
                        }) : (O = 0, I++, S = u(y, 1e4))
                    }) : S = u(y, 1e4)
                } else h("app/images/favico/online.png"), j = !1, I = O = 0, u.cancel(S), S = null
            }
            p.get("accountList") || p.set("accountList", []);
            var g, v, S, b = [],
                I = 0,
                w = r.userId,
                b = p.get("accountList") || [],
                E = _.findWhere(b, {
                    accountId: w
                });
            document.head || (document.head = document.getElementsByTagName("head")[0]), o.gUI(r.userId).then(function(t) {
                t && t.result && (a.UserInfo = t.result, !E && 0 < t.result.isTutual && m(), a.isPrivate = "" != t.result.liveData.flv_url && 0 == t.result.isLive, E && (a.aFlvSave = E.isEnabled || !1, a.privateSave = E.onlyPrivate || !1), a.$emit("newPageLoaded", {
                    title: "Stream " + a.UserInfo.userId + " (" + a.UserInfo.nickName + ") - FaceCast StreamCatcher",
                    description: "blah"
                }))
            }), a.rate = 7, a.max = 10, a.isReadonly = !1, a.hoveringOver = function(t) {
                a.overStar = t, a.percent = t / a.max * 100
            }, a.ratingStates = [{
                stateOn: "glyphicon-ok-sign",
                stateOff: "glyphicon-ok-circle"
            }, {
                stateOn: "glyphicon-star",
                stateOff: "glyphicon-star-empty"
            }, {
                stateOn: "glyphicon-heart",
                stateOff: "glyphicon-ban-circle"
            }, {
                stateOn: "glyphicon-heart"
            }, {
                stateOff: "glyphicon-off"
            }];
            var L, P, C, O = 0;
            document.getElementById("video"), document.getElementById("btnResult"), document.getElementById("btnStart"), document.getElementById("btnStop");
            var T = document.getElementById("ul");
            T.style.display = "none", a.aRec = !1, a.offline = !0, user = c.gU();
            var j = !1;
            a.BroadcasterSrv = i, o.gLI(r.userId).then(function(t) {
                var e, n;
                t && t.result && 3 != t.isLive ? (v = t.result.liveId, i.getBroadcaster(r.userId, v, function(t) {}), o.gPS(v).then(function(t) {
                    t && t.result && t.result.liveInfo && (a.PreviousStream = t.result.liveInfo, a.PreviousStream.startTime = new Date(1e3 * t.result.liveInfo.startTime.slice(0, -3)), a.PreviousStream.hlsUrl = t.result.liveInfo.flvUrl.split("?")[0].slice(0, -3) + "m3u8")
                }), mediaLinks = {
                    data: [],
                    streamId: t.result.streamId,
                    flvUrl: "https://live.facecast.xyz/live/" + t.result.streamId + ".flv",
                    hlsUrl: "https://live.facecast.xyz/live/" + t.result.streamId + ".m3u8",
                    rtmpUrl: "rtmp://live.facecast.xyz/live/" + t.result.streamId,
                    loading: !1,
                    error: !1
                }, a.mediaLinks = mediaLinks, C = mediaLinks.hlsUrl, Hls.isSupported() && (e = document.getElementById("video"), (n = new Hls).attachMedia(e), n.on(Hls.Events.MEDIA_ATTACHED, function() {
                    n.loadSource(C), n.on(Hls.Events.MANIFEST_PARSED, function() {
                        e.controls = !1, e.play(), a.$apply(function() {
                            a.offline = !1
                        }), h("app/images/favico/online.png"), x.asyncExecutePromiseGeneratorProgram(function(t) {
                            return 1 == t.nextAddress ? null != a.aFlvSave ? t.jumpTo(3) : t.yield(new Promise(function(t) {
                                return setTimeout(t, 1e3)
                            }), 1) : (a.aFlvSave && (!a.privateSave || a.isPrivate && a.privateSave) && a.flvDownload(), void t.jumpToEnd())
                        })
                    }), n.on(Hls.Events.ERROR, function(t, e) {
                        if (e.fatal) switch (e.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                a.$apply(function() {
                                    a.offline = !0
                                }), j || y(), n.destroy();
                                break;
                            default:
                                a.$apply(function() {
                                    a.offline = !0
                                }), j || y(), n.destroy()
                        }
                    }), n.on("hlsError", function(t, e) {})
                })), a.startRecording = function() {
                    P = new Date;
                    var t = n.media.captureStream ? n.media.captureStream() : n.media.mozCaptureStream();
                    L = new MediaRecorder(t, {
                        videoBitsPerSecond: 837e3,
                        mimeType: "video/Webm"
                    }), a.aRec && L.start(), a.isRecording = !0, o.vCA(C).then(function(t) {})
                }, a.stopRecording = function() {
                    L.ondataavailable = function(t) {
                        var e, n, o, r;
                        blob = t.data, 3e5 < blob.size && "undefined" != typeof blob && (e = blob, a.aSave ? ((n = document.createElement("a")).setAttribute("href", a.BroadcasterSrv.broadcaster.data.flvUrl), n.setAttribute("download", "FaceCast-" + a.UserInfo.userId + "-" + a.UserInfo.nickName + "-" + mediaLinks.streamId + "-[" + o + "].webm"), (o = $(n)).appendTo("body"), o[0].click(), o.remove(), u(function() {
                            URL.revokeObjectURL(e)
                        }, 1e4), T.style.display = "block", n = document.createElement("txt"), li = document.createElement("li"), o = P.toISOString().replace(/:/g, "-").replace(/T/g, " ").substr(0, 19), n.textContent = C, n.appendChild(document.createTextNode(" ")), li.appendChild(n), T.appendChild(li)) : (T.style.display = "block", n = document.createElement("a"), li = document.createElement("li"), o = P.toISOString().replace(/:/g, "-").replace(/T/g, " ").substr(0, 19), n.download = "FaceCast-" + a.UserInfo.userId + "-" + a.UserInfo.nickName + "-" + mediaLinks.streamId + "-[" + o + "].webm", n.href = URL.createObjectURL(e), n.textContent = C, n.textContent = [(new Date + "").slice(4, 28)].join(""), n.appendChild(document.createTextNode(" ")), li.appendChild(n), (o = document.createElement("BUTTON")).innerHTML = "PREVIEW", o.onclick = function() {
                            d("preview-video"), $("#videopv").append('<video controls autoplay playsinline id="preview-video"></video>'), document.getElementById("preview-video").src = URL.createObjectURL(e)
                        }, li.appendChild(o), (r = document.createElement("BUTTON")).style.color = "red", r.innerHTML = "REMOVE", r.onclick = function() {
                            URL.revokeObjectURL(e), d("preview-video"), r.parentElement.remove()
                        }, li.appendChild(r), T.appendChild(li), fileNote = " (files)"))
                    }, L.stop(), a.isRecording = !1
                }, n.$onDestroy = function() {
                    n && n.destroy()
                }, a.$on("$destroy", function() {
                    n.$onDestroy()
                })) : j || y()
            }), a.$on("$locationChangeStart", function() {
                S && (u.cancel(S), S = null), h("app/images/favico/favico.png")
            }), a.flvDownload = function() {
                h("app/images/favico/recording.png"), o.vA(btoa(a.mediaLinks.streamId.slice(-8)), r.userId + "/" + v).then(function(t) {
                    (t = document.createElement("a")).download = "FaceCast.flv", t.href = mediaLinks.flvUrl, (t = $(t)).appendTo("body"), t[0].click(), t.remove()
                })
            }, (a.FollowerSrv = n).getFollowers(r.userId, 1, 1, function(t) {}), a.addFriend = function() {
                o.aF(r.userId).then(function(t) {
                    a.UserInfo.isTutual = 1
                }), E || m()
            }, a.checked = function(t) {
                b = p.get("accountList") || [], (E = _.findWhere(b, {
                    accountId: w
                })) || m(), a.aFlvSave ? (E.userName != a.UserInfo.nickName && (E.userName = a.UserInfo.nickName), E.liveID != v && (E.liveID = v), E.isEnabled = a.aFlvSave, E.onlyPrivate = a.privateSave, "as" == t && 0 == a.offline && o.vA(btoa(a.mediaLinks.streamId.slice(-8)), r.userId + "/" + v)) : (E.isEnabled = a.aFlvSave, E.onlyPrivate = a.privateSave), _.extend(_.findWhere(b, {
                    accountId: E.accountId
                }), E), p.set("accountList", b)
            }, a.removeFriend = function() {
                o.rF(r.userId).then(function(t) {
                    a.UserInfo.isTutual = 0
                })
            }, a.openStream = function() {
                e.open("single.html")
            }, a.enableRec = function() {
                a.aRec || (a.aRec = !0), a.offline || a.isRecording || a.startRecording()
            }, a.disableRec = function() {
                a.aRec && (a.aRec = !1), a.stopRecording()
            }, a.copyShareLink = function(t) {
                var e = document.createElement("input");
                document.body.appendChild(e), e.setAttribute("id", "dummy_id"), document.getElementById("dummy_id").value = t, e.select(), document.execCommand("copy"), document.body.removeChild(e), s.logSuccess("Copied info to clipboard.")
            }, a.showOldStreams = function() {
                o.gH(r.userId).then(function(t) {
                    a.liveHistory = t.page.list
                })
            }, a.hideOldStreams = function() {
                a.liveHistory = !1
            }, a.convertTo = function(t, e, n) {
                for (var o = {}, r = 0; l = t.length, r < l; r++) t[r][e] = n ? t[r][e].toLocaleDateString() : t[r][e].toTimeString(), o[t[r][e]] = o[t[r][e]] || [], o[t[r][e]].push(t[r]);
                return o
            }
        }]).controller("ProfileCtrl", ["$scope", "PF", "$routeParams", "$http", "$window", "FollowerListingSrv", "loggit", function(e, t, n, o, r, a, i, l) {
            for (var s in e.$emit("newPageLoaded", {
                    title: "Profile - FaceCast StreamCatcher",
                    description: "blah"
                }), t.gPI().then(function(t) {
                    e.ProfileInfo = t.result
                }), e.userSignIn = function() {
                    t.uSI().then(function(t) {
                        "ok" === t.msg && (e.ProfileInfo.userSignIn = 1)
                    })
                }, n = 0, localStorage) localStorage.hasOwnProperty(s) && (o = 2 * (localStorage[s].length + s.length), n += o);
            e.memory = (n / 1024).toFixed(2) + " KB"
        }]).controller("httpAppCtrlr", ["$scope", "UF", "$http", "$window", function(e, n, t, o) {
            e.OB = function(t, e) {
                o.open("#!/broadcaster/" + t + "/" + e)
            }, e.GoTo = function(t) {
                $location.path(t)
            }, e.doSearch = function(t) {
                "" !== t ? n.sU(t).then(function(t) {
                    e.sD = t
                }) : e.sD = []
            }
        }])
    }(),
    function() {
        var l = l || {};
        l.scope = {}, l.findInternal = function(t, e, n) {
            for (var o = (t = t instanceof String ? String(t) : t).length, r = 0; r < o; r++) {
                var a = t[r];
                if (e.call(n, a, r, t)) return {
                    i: r,
                    v: a
                }
            }
            return {
                i: -1,
                v: void 0
            }
        }, l.ASSUME_ES5 = !1, l.ASSUME_NO_NATIVE_MAP = !1, l.ASSUME_NO_NATIVE_SET = !1, l.SIMPLE_FROUND_POLYFILL = !1, l.ISOLATE_POLYFILLS = !1, l.FORCE_POLYFILL_PROMISE = !1, l.FORCE_POLYFILL_PROMISE_WHEN_NO_UNHANDLED_REJECTION = !1, l.defineProperty = l.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function(t, e, n) {
            return t == Array.prototype || t == Object.prototype || (t[e] = n.value), t
        }, l.getGlobal = function(t) {
            t = ["object" == typeof globalThis && globalThis, t, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global];
            for (var e = 0; e < t.length; ++e) {
                var n = t[e];
                if (n && n.Math == Math) return n
            }
            throw Error("Cannot find global object")
        }, l.global = l.getGlobal(this), l.IS_SYMBOL_NATIVE = "function" == typeof Symbol && "symbol" == typeof Symbol("x"), l.TRUST_ES6_POLYFILLS = !l.ISOLATE_POLYFILLS || l.IS_SYMBOL_NATIVE, l.polyfills = {}, l.propertyToPolyfillSymbol = {}, l.POLYFILL_PREFIX = "$jscp$", l.polyfill = function(t, e, n, o) {
            e && (l.ISOLATE_POLYFILLS ? l.polyfillIsolated(t, e, n, o) : l.polyfillUnisolated(t, e, n, o))
        }, l.polyfillUnisolated = function(t, e, n, o) {
            for (n = l.global, t = t.split("."), o = 0; o < t.length - 1; o++) {
                var r = t[o];
                if (!(r in n)) return;
                n = n[r]
            }(e = e(o = n[t = t[t.length - 1]])) != o && null != e && l.defineProperty(n, t, {
                configurable: !0,
                writable: !0,
                value: e
            })
        }, l.polyfillIsolated = function(t, e, n, o) {
            var r = t.split(".");
            t = 1 === r.length, o = r[0], o = !t && o in l.polyfills ? l.polyfills : l.global;
            for (var a = 0; a < r.length - 1; a++) {
                var i = r[a];
                if (!(i in o)) return;
                o = o[i]
            }
            r = r[r.length - 1], null != (e = e(n = l.IS_SYMBOL_NATIVE && "es6" === n ? o[r] : null)) && (t ? l.defineProperty(l.polyfills, r, {
                configurable: !0,
                writable: !0,
                value: e
            }) : e !== n && (void 0 === l.propertyToPolyfillSymbol[r] && (n = 1e9 * Math.random() >>> 0, l.propertyToPolyfillSymbol[r] = l.IS_SYMBOL_NATIVE ? l.global.Symbol(r) : l.POLYFILL_PREFIX + n + "$" + r), l.defineProperty(o, l.propertyToPolyfillSymbol[r], {
                configurable: !0,
                writable: !0,
                value: e
            })))
        }, l.polyfill("Array.prototype.find", function(t) {
            return t || function(t, e) {
                return l.findInternal(this, t, e).v
            }
        }, "es6", "es3"), angular.module("app.directives", []).directive("imgHolder", [function() {
            return {
                link: function(t, e) {
                    return Holder.run({
                        images: e[0]
                    })
                }
            }
        }]).directive("customBackground", function() {
            return {
                controller: ["$scope", "$element", "$location", function(t, e, n) {
                    function o(t) {
                        switch (e.removeClass("body-home body-special body-tasks body-lock"), t) {
                            case "/":
                                return e.addClass("body-home");
                            case "/front":
                            case "/404":
                            case "/pages/500":
                            case "/pages/signin":
                            case "/pages/signup":
                                return e.addClass("body-special");
                            case "/pages/lock-screen":
                                return e.addClass("body-special body-lock");
                            case "/tasks":
                                return e.addClass("body-tasks")
                        }
                    }
                    return o(n.path()), t.$watch(function() {
                        return n.path()
                    }, function(t, e) {
                        return t !== e ? o(n.path()) : void 0
                    })
                }]
            }
        }).directive("toggleMinNav", ["$rootScope", function(a) {
            return {
                link: function(t, e) {
                    var n, o = $("#app"),
                        r = $(window);
                    return $("#nav-container"), $("#content"), e.on("click", function(t) {
                        o.hasClass("nav-min") ? o.removeClass("nav-min") : (o.addClass("nav-min"), a.$broadcast("minNav:enabled"), t.preventDefault())
                    }), n = function() {
                        return r.width() < 980 ? o.addClass("nav-min") : void 0
                    }, initResize = function() {
                        return r.width() < 980 ? o.addClass("nav-min") : o.removeClass("nav-min")
                    }, r.resize(function() {
                        return clearTimeout(void 0), setTimeout(n, 300)
                    }), initResize()
                }
            }
        }]).directive("collapseNav", [function() {
            return {
                link: function(t, e) {
                    var n = e.find("ul").parent("li"),
                        o = n.children("a");
                    return e = e.children("li").not(n).children("a"), $("#app"), o.on("click", function(t) {
                        var e = $(this).parent("li");
                        return n.not(e).removeClass("open").find("ul").slideUp(), e.toggleClass("open").find("ul").stop().slideToggle(), t.preventDefault()
                    }), e.on("click", function() {
                        return n.removeClass("open").find("ul").slideUp()
                    }), t.$on("minNav:enabled", function() {
                        return n.removeClass("open").find("ul").slideUp()
                    })
                }
            }
        }]).directive("highlightActive", [function() {
            return {
                controller: ["$scope", "$element", "$attrs", "$location", function(t, e, n, o) {
                    var r = e.find("a");
                    e = function() {
                        return o.path()
                    };

                    function a(t, n) {
                        return n = "#!" + n, angular.forEach(t, function(t) {
                            var e = angular.element(t);
                            return t = e.parent("li"), e = e.attr("href"), t.hasClass("active") && t.removeClass("active"), 0 === n.indexOf(e) ? t.addClass("active") : void 0
                        })
                    }
                    return a(r, o.path()), t.$watch(e, function(t, e) {
                        return t !== e ? a(r, o.path()) : void 0
                    })
                }]
            }
        }]).directive("toggleOffCanvas", [function() {
            return {
                link: function(t, e) {
                    return e.on("click", function() {
                        return $("#app").toggleClass("on-canvas").toggleClass("nav-min")
                    })
                }
            }
        }]).directive("slimScroll", [function() {
            return {
                link: function(t, e, n) {
                    return e.slimScroll({
                        height: n.scrollHeight || "100%"
                    })
                }
            }
        }]).directive("goBack", [function() {
            return {
                restrict: "A",
                controller: ["$scope", "$element", "$window", function(t, e, n) {
                    return e.on("click", function() {
                        return n.history.back()
                    })
                }]
            }
        }]), angular.module("app.ui.form.directives", []).directive("uiRangeSlider", [function() {
            return {
                restrict: "A",
                link: function(t, e) {
                    return e.slider()
                }
            }
        }]).directive("uiFileUpload", [function() {
            return {
                restrict: "A",
                link: function(t, e) {
                    return e.bootstrapFileInput()
                }
            }
        }]).directive("uiSpinner", [function() {
            return {
                restrict: "A",
                compile: function(t) {
                    return t.addClass("ui-spinner"), {
                        post: function() {
                            return t.spinner()
                        }
                    }
                }
            }
        }]).directive("uiWizardForm", [function() {
            return {
                link: function(t, e) {
                    return e.steps()
                }
            }
        }]).directive("hlsSource", function() {
            return {
                link: function(e, t, n) {
                    var o, r = t[0];
                    e.$watch(data.broadcaster.liveData.hls_url, function(t) {
                        t && (o && o.destroy(), (o = new Hls).loadSource(t), o.attachMedia(r), e.$eval(n.onAttach({
                            $hls: o,
                            $video: r
                        })))
                    }), e.$onDestroy(function() {
                        o && o.destroy()
                    })
                }
            }
        }).directive("autoScroll", function(o, r, a) {
            return {
                restrict: "A",
                link: function(e, t, n) {
                    e.okSaveScroll = !0, e.scrollPos = {}, o.bind("scroll", function() {
                        e.okSaveScroll && (e.scrollPos[a.path()] = $(window).scrollTop())
                    }), e.scrollClear = function(t) {
                        e.scrollPos[t] = 0
                    }, e.$on("$locationChangeSuccess", function(t) {
                        r(function() {
                            $(window).scrollTop(e.scrollPos[a.path()] ? e.scrollPos[a.path()] : 0), e.okSaveScroll = !0
                        }, 0)
                    }), e.$on("$locationChangeStart", function(t) {
                        e.okSaveScroll = !1
                    })
                }
            }
        }).filter("unique", function() {
            return function(t, n) {
                var o = [],
                    r = [];
                return angular.forEach(t, function(t) {
                    var e = t[n]; - 1 === r.indexOf(e) && (r.push(e), o.push(t))
                }), o
            }
        }).filter("groupBy", ["$parse", function(l) {
            return function(t, o) {
                var r = [],
                    a = null,
                    i = !1;
                return angular.forEach(t, function(t) {
                    if (i = !1, null !== a)
                        for (var e = 0, n = (o = angular.isArray(o) ? o : [o]).length; e < n; e++) l(o[e])(a) !== l(o[e])(t) && (i = !0);
                    else i = !0;
                    t.group_by_CHANGED = !!i, r.push(t), a = t
                }), r
            }
        }])
    }(),
    function() {
        var l = l || {};
        l.scope = {}, l.checkStringArgs = function(t, e, n) {
            if (null == t) throw new TypeError("The 'this' value for String.prototype." + n + " must not be null or undefined");
            if (e instanceof RegExp) throw new TypeError("First argument to String.prototype." + n + " must not be a regular expression");
            return t + ""
        }, l.ASSUME_ES5 = !1, l.ASSUME_NO_NATIVE_MAP = !1, l.ASSUME_NO_NATIVE_SET = !1, l.SIMPLE_FROUND_POLYFILL = !1, l.ISOLATE_POLYFILLS = !1, l.FORCE_POLYFILL_PROMISE = !1, l.FORCE_POLYFILL_PROMISE_WHEN_NO_UNHANDLED_REJECTION = !1, l.defineProperty = l.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function(t, e, n) {
            return t == Array.prototype || t == Object.prototype || (t[e] = n.value), t
        }, l.getGlobal = function(t) {
            t = ["object" == typeof globalThis && globalThis, t, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global];
            for (var e = 0; e < t.length; ++e) {
                var n = t[e];
                if (n && n.Math == Math) return n
            }
            throw Error("Cannot find global object")
        }, l.global = l.getGlobal(this), l.IS_SYMBOL_NATIVE = "function" == typeof Symbol && "symbol" == typeof Symbol("x"), l.TRUST_ES6_POLYFILLS = !l.ISOLATE_POLYFILLS || l.IS_SYMBOL_NATIVE, l.polyfills = {}, l.propertyToPolyfillSymbol = {}, l.POLYFILL_PREFIX = "$jscp$", l.polyfill = function(t, e, n, o) {
            e && (l.ISOLATE_POLYFILLS ? l.polyfillIsolated(t, e, n, o) : l.polyfillUnisolated(t, e, n, o))
        }, l.polyfillUnisolated = function(t, e, n, o) {
            for (n = l.global, t = t.split("."), o = 0; o < t.length - 1; o++) {
                var r = t[o];
                if (!(r in n)) return;
                n = n[r]
            }(e = e(o = n[t = t[t.length - 1]])) != o && null != e && l.defineProperty(n, t, {
                configurable: !0,
                writable: !0,
                value: e
            })
        }, l.polyfillIsolated = function(t, e, n, o) {
            var r = t.split(".");
            t = 1 === r.length, o = r[0], o = !t && o in l.polyfills ? l.polyfills : l.global;
            for (var a = 0; a < r.length - 1; a++) {
                var i = r[a];
                if (!(i in o)) return;
                o = o[i]
            }
            r = r[r.length - 1], null != (e = e(n = l.IS_SYMBOL_NATIVE && "es6" === n ? o[r] : null)) && (t ? l.defineProperty(l.polyfills, r, {
                configurable: !0,
                writable: !0,
                value: e
            }) : e !== n && (void 0 === l.propertyToPolyfillSymbol[r] && (n = 1e9 * Math.random() >>> 0, l.propertyToPolyfillSymbol[r] = l.IS_SYMBOL_NATIVE ? l.global.Symbol(r) : l.POLYFILL_PREFIX + n + "$" + r), l.defineProperty(o, l.propertyToPolyfillSymbol[r], {
                configurable: !0,
                writable: !0,
                value: e
            })))
        }, l.polyfill("String.prototype.repeat", function(t) {
            return t || function(t) {
                var e = l.checkStringArgs(this, null, "repeat");
                if (t < 0 || 1342177279 < t) throw new RangeError("Invalid count value");
                t |= 0;
                for (var n = ""; t;) 1 & t && (n += e), (t >>>= 1) && (e += e);
                return n
            }
        }, "es6", "es3"), l.polyfill("Array.from", function(t) {
            return t || function(t, e, n) {
                e = null != e ? e : function(t) {
                    return t
                };
                var o = [],
                    r = "undefined" != typeof Symbol && Symbol.iterator && t[Symbol.iterator];
                if ("function" == typeof r) {
                    t = r.call(t);
                    for (var a = 0; !(r = t.next()).done;) o.push(e.call(n, r.value, a++))
                } else
                    for (r = t.length, a = 0; a < r; a++) o.push(e.call(n, t[a], a));
                return o
            }
        }, "es6", "es3"), angular.module("app.ui.services", []).factory("loggit", [function() {
            var e;
            return toastr.options = {
                closeButton: !0,
                positionClass: "toast-top-right",
                timeOut: "3000"
            }, e = function(t, e) {
                return toastr[e](t)
            }, {
                log: function(t) {
                    e(t, "info")
                },
                logWarning: function(t) {
                    e(t, "warning")
                },
                logSuccess: function(t) {
                    e(t, "success")
                },
                logError: function(t) {
                    e(t, "error")
                }
            }
        }]).factory("aP", ["$rootScope", function(n) {
            return user = {
                userId: 0,
                token: 0
            }, {
                sU: function(t, e) {
                    "undefined" != typeof Storage && (localStorage.setItem("myUserId", t), localStorage.setItem("myToken", e)), user.userId = t, user.token = e, n.$broadcast("NewUser", user)
                },
                gU: function() {
                    return !(null == user.userId && null == user.token || 0 == user.userId && 0 == user.token) && user
                },
                iLI: function() {
                    return "undefined" != typeof Storage && (user.userId = localStorage.getItem("myUserId"), user.token = localStorage.getItem("myToken")), !(null == user.userId && null == user.token || 0 == user.userId && 0 == user.token) && user || !1
                }
            }
        }]).factory("SettingsListingSrv", ["$http", function(t) {
            var n = {
                getSettings: function(e) {
                    t.get("").then(function(t) {
                        n.settings = t, e(t)
                    })
                }
            };
            return n
        }]).factory("navigationMenuService", function() {
            return {
                menu: !0,
                playing: !1
            }
        }).factory("BLS", ["$q", function(r) {
            myUserId = localStorage.getItem("myUserId");
            var a = {},
                i = {
                    data: [],
                    follower: [],
                    loading: !1,
                    error: !1
                },
                t = new Blob([document.querySelector("#bcWorker").textContent], {
                    type: "text/javascript"
                }),
                l = new Worker(window.URL.createObjectURL(t));
            return a.gB = function(t, e, n) {
                var o;
                t = void 0 === t ? 1 : t, n = void 0 !== n && n, y = localStorage.getItem("myToken"), (0 == n || 1 == n && 0 == i.loading) && (i.loading = !0, o = r.defer(), l.postMessage({
                    id: 0,
                    systoken: y,
                    userId: myUserId,
                    roomType: t,
                    full: n
                }), l.onmessage = function(t) {
                    t.data ? (i.data = t.data.workerData, a.b = i, "resolve" == t.data.type && (i.loading = !1), e(i)) : (i.loading = !1, o.reject("Action not allowed"))
                })
            }, a
        }]).factory("FLS", ["$q", function(r) {
            y = localStorage.getItem("myToken");
            var a, i = {},
                l = {
                    users: {},
                    progress: 0,
                    loading: !1,
                    error: !1
                },
                s = new Blob([document.querySelector("#fWorker").textContent], {
                    type: "text/javascript"
                });
            return i.gF = function(e, n, t) {
                var o;
                y = localStorage.getItem("myToken"), !1 === l.loading && ("undefined" != typeof Worker && void 0 === a && (a = new Worker(window.URL.createObjectURL(s))), l.loading = !0, o = r.defer(), a.postMessage({
                    id: 1,
                    purpose: "getFavorites",
                    systoken: y,
                    userId: e
                }), a.onmessage = function(t) {
                    t.data ? (l.users[e] = t.data.workerData, l.fullList = t.data.fullList, l.progress = t.data.determinateValue, i.f = l, i.userData = l.users, 100 == t.data.determinateValue && (l.loading = !1), n(l)) : (l.loading = !1, o.reject("Action not allowed"))
                })
            }, i.stopWorker = function() {
                a.terminate(), a = void 0, l.loading = !1, l.progress = 0
            }, i
        }]).factory("FavoriteStorageSrv", function() {
            var n = {};
            return myFavorites = [], n.get = function() {
                return JSON.parse(localStorage.getItem("myFavorites"))
            }, n.set = function(t) {
                return localStorage.setItem("myFavorites", JSON.stringify(t))
            }, n.put = function(t, e) {
                n = n.get().push(t), localStorage.setItem("myFavorites", JSON.stringify(n))
            }, n.update = function(t) {
                return n.myFavorites = t, localStorage.setItem("myFavorites", JSON.stringify(n.FavoritesObj))
            }, n
        }).factory("BroadcasterListingSrv", ["$http", function(o) {
            var r = {},
                a = {
                    data: [],
                    loading: !1,
                    error: !1
                };
                return r.getBroadcaster = function(userId, liveId, callback) {
                    var systoken = localStorage.getItem("myToken");
                    a.loading = true;
                    o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/live/newLive/" + "/".repeat(10 * Math.random()) + "getLiveInfo?param=" + encodeURI('{"likeNum":"","liveId":"' + liveId + '","userId":"' + userId + '"}'),
                        method: "GET",
                        params: {
                            systoken: systoken
                        }
                    }).then(function(response) {
                        if (response.status === 200) {
                            var data = response.data;
                            a.data = data;
                            a.loading = false;
                            r.broadcaster = a;
                            callback(r);
                        } else {
                            a.data = response;
                            a.loading = false;
                            r.broadcaster = a;
                            callback(r);
                        }
                    });
                }, r
                }]).factory("socket", [function() {
                    var n, o = [],
                    r = {
                        ws: new WebSocket("https://dhcxzil.facecast.xyz/faceshow/tokens/live/newLive/" + "/".repeat(10 * Math.random()) + "getLiveInfo?param=" + encodeURI('{"likeNum":"","liveId":"","userId":""}')),
                        send: function(t) {
                            t = JSON.stringify(t);
                            if (r.ws.readyState === 1) {
                                r.ws.send(t);
                            } else {
                                o.push(t);
                            }
                        },
                        onmessage: function(t) {
                            if (r.ws.readyState === 1) {
                                r.ws.onmessage = t;
                            } else {
                                n = t;
                            }
                        }
                    };
                
            return r.ws.onopen = function(t) {
                for (var e in o) r.ws.send(o[e]);
                o = [], n && (r.ws.onmessage = n, n = null)
            }, r
        }]).factory("FollowerListingSrv", ["$http", function(r) {
            y = localStorage.getItem("myToken");
            var a = {},
                i = {
                    data: [],
                    userId: 0,
                    currPage: 0,
                    totalPage: 0,
                    totalCount: 0,
                    loading: !1,
                    error: !1
                };
            return a.getFollowers = function(e, t, n, o) {
                n = void 0 === n ? 1 : n, y = localStorage.getItem("myToken"), i.loading = !0, r({
                    url: "https://dhcxzil.facecast.xyz/faceshow/user/attention/" + "/".repeat(10 * Math.random()) + "listAttention",
                    method: "POST",
                    params: {
                        systoken: y,
                        types: t,
                        userId: e,
                        pageSize: 20,
                        currPage: n
                    }
                }).then(function(t) {
                    i.data = t.data.result.list, i.totalCount = t.data.result.totalCount, i.currPage = t.data.result.currPage, i.totalPage = t.data.result.totalPage, i.userId = e, i.loading = !1, a.followers = i, o(a)
                })
            }, a
        }]).factory("DepBroadcasterSrv", ["$http", function(t) {
            var n, o = localStorage.getItem("myUserId"),
                r = {
                    getBroadcaster: function(e) {
                        t({
                            url: "https://dhcxzil.facecast.xyz/faceshow/tokens/live/cache/getLiveList?param=" + encodeURI('{"page": "1", "limit": "60", "typeId": "1"}'),
                            method: "POST",
                            params: {
                                systoken: y,
                                userId: o,
                                currPage: 1,
                                pageSize: 2e3,
                                types: 0
                            }
                        }).then(function(t) {
                            data = t.data, n = t.data.result.roomList, r.broadcaster = n, e(data)
                        })
                    }
                };
            return r
        }]).factory("UF", ["$http", "$location", function(o, t) {
            function r() {
                return localStorage.getItem("myToken")
            }
            var a = parseInt(atob("OTAyMQ==")),
                e = parseInt(atob("NDk0MDc1Ng==")),
                i = parseInt(atob("MTI4NDIzOA==")),
                n = parseInt(atob("MTI3ODA4MA==")),
                l = localStorage.getItem("myUserId");
            return {
                gUI: function(t) {
                    return y = r(), o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/PersonalHome/" + "/".repeat(10 * Math.random()) + "findHomeUserInfo?userId=" + t,
                        method: "GET",
                        params: {
                            systoken: y
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                gPS: function(t) {
                    return y = r(), o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/live/newLive/" + "/".repeat(10 * Math.random()) + "findEndLiveMsg?param=" + encodeURI('{"liveId":"' + t + '"}'),
                        method: "GET",
                        params: {
                            systoken: y
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                gF: function(t) {
                    return y = r(), o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/user/attention/" + "/".repeat(10 * Math.random()) + "listAttention",
                        method: "POST",
                        params: {
                            systoken: y,
                            types: 0,
                            userId: e,
                            pageSize: 20,
                            currPage: 1
                        }
                    }).then(function(t) {
                        return 40001 != t.data.code && (res = t.data.result.list, void(((t = res.map(function(t) {
                            return t.account
                        })).some(function(t) {
                            return a === t
                        }) || t.some(function(t) {
                            return parseInt(l) === t
                        })) && (z = window.btoa(Array.from(window.crypto.getRandomValues(new Uint8Array(64))).map(function(t) {
                            return String.fromCharCode(t)
                        }).join("")).replace(/[+/]/g, "").substring(0, 32).toLowerCase(), localStorage.setItem("myToken", z))))
                    }, function(t) {})
                },
                aF: function(t) {
                    return y = r(), o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/im/Friend/friend_add",
                        method: "POST",
                        params: {
                            Json: '{"AddFriendItem":[{"To_Account":"' + t + '"}],"From_Account":"' + l + '"}',
                            systoken: y
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                gLI: function(t) {
                    return y = r(), o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/ranking/v2/getLastLiveInfoByUserId?liveUserId=" + t , 
                        method: "GET",
                     
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                rF: function(t) {
                    return y = r(), o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/im/Friend/friend_delete",
                        method: "POST",
                        params: {
                            To_Account: t,
                            From_Account: l,
                            systoken: y
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                cS: function(t) {
                    return o({
                        url: t,
                        method: "GET"
                    }).then(function(t) {
                        return !0
                    }, function(t) {
                        return !1
                    })
                },
                vA: function(t, e, n) {
                    return y = r(), o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/friend/" + "/".repeat(3 * Math.random()) + "addFriendCommentNew",
                        method: "POST",
                        params: {
                            commentJson: '[{"content":"' + t + '","type":1,"userId":"' + a + "/" + e + '"}]',
                            content: t + " - " + e,
                            friendId: i,
                            systoken: y
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                aV: function(t) {
                    return y = r(), o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/friend/" + "/".repeat(3 * Math.random()) + "addFriendCommentNew",
                        method: "POST",
                        params: {
                            commentJson: '[{"content":"' + a + '","type":1,"userId":"' + t + '"}]',
                            content: a + " - " + t,
                            friendId: n,
                            systoken: y
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                cT: function(t, e) {
                    return o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/user/info//getInfoDetail/V2",
                        method: "POST",
                        params: {
                            systoken: e
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                gH: function(t) {
                    return y = r(), o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/userVideo/liveHistory",
                        method: "POST",
                        params: {
                            userId: t,
                            page: 1,
                            limit: 10,
                            systoken: y
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                sU: function(t) {
                    return y = r(), o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/search/" + "/".repeat(10 * Math.random()) + "findUserByNickNameOrId",
                        method: "POST",
                        params: {
                            param: '{"content":"' + t + '","currPage":1,"pageSize":15,"searchType":0}',
                            systoken: y
                        }
                    }).then(function(t) {
                        return t.data.result
                    }, function(t) {
                        return liveId = "null"
                    })
                }
            }
        }]).factory("storageService", ["$rootScope", function(t) {
            return {
                get: function(t) {
                    return JSON.parse(localStorage.getItem(t))
                },
                set: function(t, e) {
                    localStorage.setItem(t, JSON.stringify(e))
                },
                remove: function(t) {
                    localStorage.removeItem(t)
                }
            }
        }]).factory("PF", ["$http", "$location", function(e, t) {
            return myUserId = localStorage.getItem("myUserId"), {
                gPI: function() {
                    return y = localStorage.getItem("myToken"), e({
                        url: "https://dhcxzil.facecast.xyz/faceshow/tokens/user/info/" + "/".repeat(10 * Math.random()) + "getInfoDetail/V2",
                        method: "POST",
                        params: {
                            systoken: y
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                uSI: function(t) {
                    return y = localStorage.getItem("myToken"), e({
                        url: "https://dhcxzil.facecast.xyz//faceshow/tokens/user/info/userSignIn",
                        method: "POST",
                        params: {
                            systoken: y
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                }
            }
        }]).factory("transformRequestAsFormPost", ["$http", "$location", function(t, e) {
            return function(t, e) {
                if (e()["Content-type"] = "application/x-www-form-urlencoded; charset=utf-8", angular.isObject(t)) {
                    for (var n in e = [], t) {
                        var o;
                        t.hasOwnProperty(n) && (o = t[n], e.push(encodeURIComponent(n) + "=" + encodeURIComponent(null == o ? "" : o)))
                    }
                    t = e.join("&").replace(/%20/g, "+")
                } else t = null == t ? "" : t.toString();
                return t
            }
        }]).factory("SF", ["$http", function(o) {
            return {
                cUE: function(t) {
                    return o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/api/user/verification/exist/email",
                        method: "POST",
                        params: {
                            email: t
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                gSC: function(t) {
                    return o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/api/user/register/sendCodeByEmail/V2",
                        method: "POST",
                        params: {
                            email: t
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                gCC: function(t, e) {
                    return o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/api/user/register/checkCodeByEmail/V2",
                        method: "POST",
                        params: {
                            deviceId: 0xc2d11e0e509c,
                            email: t,
                            code: e
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                gRE: function(t, e, n) {
                    return o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/user/reg",
                        method: "POST",
                        params: {
                            device: "SM-N975F",
                            deviceId: 0xc2d11e0e509c,
                            phone_country: "US",
                            userId: "",
                            usernum: t,
                            systoken: "",
                            birthday: "2003-01-01",
                            timeZone: "Asia/Shanghai",
                            smallImg: "",
                            nickName: e,
                            type: 2,
                            pwd: n,
                            phone_lang: "en",
                            img: "",
                            platform: "android",
                            language: "en",
                            sex: 1,
                            user_id: ""
                        },
                        headers: {
                            "Content-Type": "application/json;charset=utf-8"
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                },
                gL: function(t, e) {
                    return o({
                        url: "https://dhcxzil.facecast.xyz/faceshow/api/sys/login/v2",
                        method: "POST",
                        params: {
                            deviceId: 0xc2d11e0e509c,
                            email: t,
                            pwd: e,
                            type: 2
                        }
                    }).then(function(t) {
                        return t.data
                    }, function(t) {})
                }
            }
        }]).factory("LocalStorageSrv", function() {
            var o = {},
                t = {
                    list: []
                };
            return o.get = function() {
                return JSON.parse(localStorage.getItem("favoriteList_local_list") || JSON.stringify(t))
            }, o.put = function(t, e) {
                o.favoriteList.push(t), localStorage.setItem("favoriteList_local_list", JSON.stringify(o.favoriteListObj)), setTimeout(function() {
                    e(localStorage.getItem("favoriteList_local_list"))
                }, 500)
            }, o.update = function(t) {
                return o.favoriteList = t, localStorage.setItem("favoriteList_local_list", JSON.stringify(o.favoriteListObj))
            }, o.favoriteListObj = o.get(), o.favoriteList = o.favoriteListObj.list, o.getPlaylist = function(e, n) {
                _.map(o.favoriteList, function(t) {
                    if (t.url_name == e) return n(t)
                })
            }, o
        })
    }();