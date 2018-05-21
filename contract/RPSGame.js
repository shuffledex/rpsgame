'use strict';

var RPSGame = function() {
    LocalContractStorage.defineProperty(this, "choices", null)
    LocalContractStorage.defineProperty(this, "gamesCount", null)
    LocalContractStorage.defineProperty(this, "valueCount", null)
    LocalContractStorage.defineMapProperty(this, "game")
    LocalContractStorage.defineMapProperty(this, "games")
    LocalContractStorage.defineMapProperty(this, "ledgerGame")
}

RPSGame.prototype = {
    init: function() {
        this.choices = ["rock", "paper", "scissors"];
        this.gamesCount = 0;
        this.valueCount = 0;
        this.games.set("matches", [])
    },

    create: function(m1, m2, m3) {
        var from = Blockchain.transaction.from;
        var value = Blockchain.transaction.value;

        if (this.game.get(from)) {
            throw new Error("You still have an open game");
        }

        var minBase = new BigNumber(0);

        if (value.lte(minBase)) {
            throw new Error("You need bet!");
        }

        if (!m1 && !m2 && !m3) {
            throw new Error("You need make moves");
        }

        var _moves = this._validateMoves(m1, m2, m3);

        this.game.put(from, {
            creator: from,
            balance: value,
            moves: _moves
        });

        this._plusGame(from)

        this._saveValue(value);

        return true
    },

    play: function(gameAddress, m1, m2, m3) {
        var from = Blockchain.transaction.from;
        var value = Blockchain.transaction.value;

        if (!Blockchain.verifyAddress(gameAddress)) {
            throw new Error("Not valid Nebulas address");
        }

        var game = this.game.get(gameAddress);

        if (!game) {
            throw new Error("The game does not exist");
        }

        if (game.creator == from) {
            throw new Error("You can not play your own game");
        }

        var _balance = new BigNumber(game.balance);

        if (!_balance.eq(value)) {
            throw new Error("You need send just " + _balance + " NAS");
        }

        if (!m1 && !m2 && !m3) {
            throw new Error("You need make moves");
        }

        var _moves = this._validateMoves(m1, m2, m3)

        var creator = game.moves;
        var opponent = _moves;

        var creatorWin = new BigNumber(0);
        var opponentWin = new BigNumber(0);

        for (var i = 0; i < creator.length; i++) {
            switch(this._compare(creator[i], opponent[i])) {
                case 1:
                    creatorWin = creatorWin.plus(1);
                    break;
                case 2:
                    opponentWin = opponentWin.plus(1);
                    break;
                default:
                    break;
            }
        }

        var result = -1;
        var _balance = new BigNumber(game.balance)
        var _balanceTwice = _balance.plus(_balance)

        if (creatorWin.gt(opponentWin)) {
            if (Blockchain.transfer(game.creator, _balanceTwice)) {
                result = 1;
            }
        } else if (opponentWin.gt(creatorWin)) {
            if (Blockchain.transfer(from, _balanceTwice)) {
                result = 2;
            }
        } else if (opponentWin.eq(creatorWin)) {
            if (Blockchain.transfer(game.creator, _balance) && Blockchain.transfer(from, _balance)) {
                result = 0;
            }
        }

        if (result < 0) {
            throw new Error("Something were wrong");
        }

        this._ledgerMatch(game, from, opponent, result);

        this.game.del(gameAddress)

        this._minusGame(gameAddress)

        this._saveValue(value)

        return true
    },

    getGames: function() {
        var matches = this.games.get("matches");
        var response = [];
        for (var i = 0; i < matches.length; i++) {
            response.push({
                value: this.game.get(matches[i]).balance,
                game: this.game.get(matches[i]).creator
            })
        }

        return response
    },

    getStats: function() {
        return {
            games: this.gamesCount,
            value: this.valueCount
        }
    },

    _saveValue: function(value) {
        var valueCount = new BigNumber(this.valueCount)
        this.valueCount = valueCount.plus(value)
    },

    _countGame: function() {
        var gamesCount = new BigNumber(this.gamesCount)
        this.gamesCount = gamesCount.plus(1)
    },

    _validateMoves: function(m1, m2, m3) {
        var moves = [];
        moves.push(m1);
        moves.push(m2);
        moves.push(m3);

        if (moves.length != 3) {
            throw new Error("Wrong movements");
        }

        for (var i = 0; i < moves.length; i++) {
            if (this.choices.indexOf(moves[i]) < 0) {
                throw new Error("Wrong movements");
            }
        }

        return moves
    },

    _plusGame: function(address) {
        var _matches = this.games.get("matches")
        _matches.push(address)
        this.games.put("matches", _matches)
        this._countGame()
    },

    _minusGame: function(address) {
        var _matches = this.games.get("matches")
        var index = _matches.indexOf(address);
        if (index > -1) {
            _matches.splice(index, 1);
        }
        this.games.put("matches", _matches)
    },

    _ledgerMatch: function(game, opponentAddress, opponentMoves, result) {

        var resultCreator;
        var resultOpponent;

        if (result == 1) {
            resultCreator = "win"
            resultOpponent = "lose"
        } else {
            if (result == 2) {
                resultCreator = "lose"
                resultOpponent = "win"
            } else {
                resultCreator = "tie"
                resultOpponent = "tie"
            }
        }

        this._saveMatch(game.creator, {
            rol: "creator",
            result: resultCreator,
            yourMoves: game.moves,
            opponentMoves: opponentMoves,
            hash: Blockchain.transaction.hash,
            time: Blockchain.transaction.timestamp
        })
        this._saveMatch(opponentAddress, {
            rol: "opponent",
            result: resultOpponent,
            yourMoves: opponentMoves,
            opponentMoves: game.moves,
            hash: Blockchain.transaction.hash,
            time: Blockchain.transaction.timestamp
        })
    },

    _saveMatch: function(address, obj) {
        var matches = this.ledgerGame.get(address);
        var _matches;
        if (matches) {
            _matches = matches;
        } else {
            _matches = []
        }
        _matches.push(obj)
        this.ledgerGame.put(address, _matches)
    },

    _compare: function(choice1, choice2) {
        choice1 = this.choices.indexOf(choice1);
        choice2 = this.choices.indexOf(choice2);
        if (choice1 == choice2) {
            return 0; //tie;
        }
        if (choice1 == this.choices.length - 1 && choice2 == 0) {
            return 2; //opponent wins;
        }
        if (choice2 == this.choices.length - 1 && choice1 == 0) {
            return 1; //creator wins;
        }
        if (choice1 > choice2) {
            return 1; //creator wins;
        } else {
            return 2; //opponent wins;
        }
    }
}

module.exports = RPSGame