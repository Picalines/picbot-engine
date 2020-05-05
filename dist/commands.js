"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const argument_1 = require("./argument");
class CommandBranch {
    constructor(parentBranch, info, args, executeable) {
        this.info = info;
        this.args = args;
        this.executeable = executeable;
        this._branches = [];
        parentBranch === null || parentBranch === void 0 ? void 0 : parentBranch._branches.push(this);
    }
    get branches() {
        return this._branches.length > 0 ? this._branches : undefined;
    }
    getArgumentName(key) {
        return this.info.args ? this.info.args[key] : key;
    }
}
exports.CommandBranch = CommandBranch;
class CommandMainBranch extends CommandBranch {
    constructor(info, args, executeable) {
        super(null, info, args, executeable);
    }
}
exports.CommandMainBranch = CommandMainBranch;
class Command {
    constructor(mainBranch) {
        this.mainBranch = mainBranch;
    }
    get info() {
        return this.mainBranch.info;
    }
    handle(bot, msg, start) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let line = this.readLine(Command.spaceReader, msg.content.slice(start));
            let branch = this.mainBranch;
            let output = undefined;
            while (true) {
                if (branch.info.permissions) {
                    for (const permission of branch.info.permissions) {
                        if (!((_a = msg.member) === null || _a === void 0 ? void 0 : _a.hasPermission(permission)))
                            throw new Error(`У вас недостаточно прав: ${permission}`);
                        if (!((_c = (_b = msg.guild) === null || _b === void 0 ? void 0 : _b.me) === null || _c === void 0 ? void 0 : _c.hasPermission(permission)))
                            throw new Error(`У меня недостаточно прав: ${permission}`);
                    }
                }
                const exResult = yield this.executeBranch(bot, msg, line, branch, output);
                line = exResult.line;
                output = exResult.output;
                if (!branch.branches)
                    return;
                const sResult = this.selectBranch(line, branch.branches);
                line = sResult.line;
                branch = sResult.branch;
            }
        });
    }
    readLine(length, line) {
        let _length = typeof length == 'number' ? length : length.read(line);
        return line.slice(_length);
    }
    selectBranch(line, branches) {
        for (const branch of branches) {
            if (line.startsWith(branch.info.name)) {
                return {
                    line: this.readLine(branch.info.name.length, line),
                    branch
                };
            }
        }
        const keyWordList = branches.map(({ info: { name } }) => `\`${name}\``).join(', ');
        throw new Error(`Ожидалось одно из ключевых слов: ${keyWordList}`);
    }
    executeBranch(bot, msg, line, branch, input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!branch.executeable) {
                return {
                    line: this.readLine(Command.spaceReader, line),
                    output: null,
                };
            }
            const _arguments = branch.args;
            const parsedValues = {};
            for (const name in _arguments) {
                const arg = _arguments[name];
                let tokenLength;
                try {
                    tokenLength = arg.read(line);
                    const value = line.substring(0, tokenLength);
                    if (tokenLength <= 0)
                        throw null;
                    parsedValues[name] = arg.parse(value, msg);
                }
                catch (_a) {
                    throw new Error(`Ожидался аргумент \`${branch.getArgumentName(name)}\``);
                }
                line = this.readLine(tokenLength, line);
                line = this.readLine(Command.spaceReader, line);
            }
            return {
                line,
                output: yield branch.executeable.call(bot, msg, parsedValues, input),
            };
        });
    }
}
exports.Command = Command;
Command.spaceReader = new argument_1.SpaceReader();
