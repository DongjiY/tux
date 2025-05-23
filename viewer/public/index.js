var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
function loadResults() {
    return __awaiter(this, void 0, void 0, function () {
        var res, results, container, _i, results_1, test, card, identity, sim, service, acList, _a, _b, ac, item, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/api/results')];
                case 1:
                    res = _c.sent();
                    if (!res.ok) {
                        throw new Error('Failed to fetch results');
                    }
                    return [4 /*yield*/, res.json()];
                case 2:
                    results = _c.sent();
                    container = document.getElementById('results');
                    if (!container)
                        return [2 /*return*/];
                    container.innerHTML = '';
                    for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                        test = results_1[_i];
                        card = document.createElement('div');
                        card.style.border = "1px solid #ccc";
                        card.style.padding = "10px";
                        card.style.margin = "10px 0";
                        card.style.borderRadius = "8px";
                        card.style.background = "#f9f9f9";
                        identity = document.createElement('h2');
                        identity.textContent = test.identity;
                        card.appendChild(identity);
                        sim = document.createElement('p');
                        sim.textContent = "Simulation: ".concat(test.simulationCalls, " calls, ").concat(test.simulationTokens, " tokens");
                        card.appendChild(sim);
                        service = document.createElement('p');
                        service.textContent = "Service Agent: ".concat(test.serviceagentCalls, " calls, ").concat(test.serviceagentTokens, " tokens");
                        card.appendChild(service);
                        acList = document.createElement('ul');
                        for (_a = 0, _b = test.acceptance; _a < _b.length; _a++) {
                            ac = _b[_a];
                            item = document.createElement('li');
                            item.textContent = "[".concat(ac.passed ? "✅ PASSED" : "❌ FAILED", "] ").concat(ac.alias) +
                                (ac.reason ? " \u2014 ".concat(ac.reason) : '');
                            acList.appendChild(item);
                        }
                        card.appendChild(acList);
                        container.appendChild(card);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _c.sent();
                    console.error('Error loading results:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
loadResults();
