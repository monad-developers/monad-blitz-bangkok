"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeRarity = exports.ChallengeDifficulty = exports.MatchStatus = exports.MatchMode = void 0;
var MatchMode;
(function (MatchMode) {
    MatchMode["SPEED_SOLVE"] = "SPEED_SOLVE";
    MatchMode["OPTIMIZATION"] = "OPTIMIZATION";
    MatchMode["CTF"] = "CTF";
})(MatchMode || (exports.MatchMode = MatchMode = {}));
var MatchStatus;
(function (MatchStatus) {
    MatchStatus["CREATED"] = "CREATED";
    MatchStatus["JOINED"] = "JOINED";
    MatchStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MatchStatus["PENDING_RESOLUTION"] = "PENDING_RESOLUTION";
    MatchStatus["RESOLVED"] = "RESOLVED";
    MatchStatus["CANCELLED"] = "CANCELLED";
    MatchStatus["REFUNDED"] = "REFUNDED";
})(MatchStatus || (exports.MatchStatus = MatchStatus = {}));
var ChallengeDifficulty;
(function (ChallengeDifficulty) {
    ChallengeDifficulty["EASY"] = "EASY";
    ChallengeDifficulty["MEDIUM"] = "MEDIUM";
    ChallengeDifficulty["HARD"] = "HARD";
})(ChallengeDifficulty || (exports.ChallengeDifficulty = ChallengeDifficulty = {}));
var BadgeRarity;
(function (BadgeRarity) {
    BadgeRarity["COMMON"] = "COMMON";
    BadgeRarity["RARE"] = "RARE";
    BadgeRarity["EPIC"] = "EPIC";
    BadgeRarity["LEGENDARY"] = "LEGENDARY";
})(BadgeRarity || (exports.BadgeRarity = BadgeRarity = {}));
//# sourceMappingURL=index.js.map