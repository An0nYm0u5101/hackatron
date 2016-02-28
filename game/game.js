Hackatron = {
    score: 0
};

Hackatron.Game = function(game) {
    this.player;
};

var tron1;
var ghost1;
var pellet;

var upKey;
var downKey;
var leftKey;
var rightKey;
var emitter1;
var emitter2;
var tilemapData;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

Hackatron.Game.prototype = {
    preload: function() {
        this.load.tilemap('map', 'https://raw.githubusercontent.com/nwHacks2016/hackatron/master/assets/tiles1.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('tiles', 'https://raw.githubusercontent.com/nwHacks2016/hackatron/master/assets/part2_tileset.png');
        this.load.spritesheet('tron', 'https://raw.githubusercontent.com/nwHacks2016/hackatron/master/Images/tron.png', 32, 32, 12);
        this.load.spritesheet('ghost', 'https://raw.githubusercontent.com/nwHacks2016/hackatron/master/Images/ghost.png', 32, 32, 12);

        this.load.json('JSONobj', 'https://raw.githubusercontent.com/nwHacks2016/hackatron/master/assets/tiles1.json');
        this.load.image('pellet', 'https://raw.githubusercontent.com/nwHacks2016/hackatron/master/assets/pellet.png');
        
		this.load.image('blueball', 'images/blueball.png');
		this.load.image('poop', 'https://raw.githubusercontent.com/nwHacks2016/hackatron/master/Images/poop.png');
    },

    create: function() {
        this.playerId = guid();
        this.playerList = [];

        this.socket = io.connect();
        this.updateClientSideListener();


        var jsonfile = this.cache.getJSON('JSONobj');
        var data = jsonfile.layers[0].data;
        this.pelletHelper(data);

        // Create the map
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.map = this.add.tilemap('map');
        this.map.addTilesetImage('Wall', 'tiles');

        this.layer = this.map.createLayer('Tile Layer 1');
        this.layer.resizeWorld();

        var addAnimations = function(character) {
            character.animations.add('walkUp', [9,10,11], 3, false, true);
            character.animations.add('walkDown', [0,1,2], 3, false, true);
            character.animations.add('walkLeft', [3,4,5], 3, false, true);
            character.animations.add('walkRight', [6,7,8], 3, false, true);
        };

        var setKeys = function(character, game, up, down, left, right) {
            character.upKey = game.input.keyboard.addKey(up);
            character.downKey = game.input.keyboard.addKey(down);
            character.leftKey = game.input.keyboard.addKey(left);
            character.rightKey = game.input.keyboard.addKey(right);
        };

        var Keyboard = Phaser.Keyboard;

        tron1 = new Tron(this.game, 20, 20, 'tron');
        addAnimations(tron1.character);
        setKeys(tron1.character, this, Keyboard.UP, Keyboard.DOWN, Keyboard.LEFT, Keyboard.RIGHT);

        ghost1 = new Ghost(this.game, 50, 20, 'ghost');
        addAnimations(ghost1.character);
        setKeys(ghost1.character, this, Keyboard.W, Keyboard.S, Keyboard.A, Keyboard.D);

        tron1.character.scale.x = 0.8;
        tron1.character.scale.y = 0.8;

        ghost1.character.scale.x = 0.8;
        ghost1.character.scale.y = 0.8;

        // Collision
        this.game.physics.arcade.enable(this.layer);
        this.game.physics.arcade.enable([tron1.character, ghost1.character], Phaser.Physics.ARCADE);
        this.map.setCollision(18);
        this.map.setCollision(88);
        this.map.setCollision(54);
        this.map.setCollision(89);
        this.map.setCollision(53);
        this.map.setCollision(52);


		emitter1 = this.add.emitter(tron1.character.x, tron1.character.y, 50);
		emitter1.width = 5;
		emitter1.makeParticles('blueball');
		emitter1.setXSpeed();
		emitter1.setYSpeed();
		emitter1.setRotation();
		emitter1.setAlpha(1, 0.4, 800);
		emitter1.setScale(0.05, 0.2, 0.05, 0.2, 2000, Phaser.Easing.Quintic.Out);
		emitter1.start(false,250, 1);
		
		emitter2 = this.add.emitter(ghost1.character.x, ghost1.character.y, 50);
		emitter2.width = 5;
		emitter2.makeParticles('poop');
		emitter2.setXSpeed();
		emitter2.setYSpeed();
		emitter2.setRotation();
		emitter2.setAlpha(1, 0.4, 800);
		emitter2.setScale(0.05, 0.2, 0.05, 0.2, 2000, Phaser.Easing.Quintic.Out);
		emitter2.start(false,250, 1);

        // Add score text
        this.scoreText = this.add.text(this.world.width - 128, 0, 'Score: 0');
        this.scoreText.addColor('White', 0);
    }, 

    update: function() {
        var collisionHandler = function() {
            //ghost1.killTron(tron1);
            console.log('collision!');

        };

        this.updateCharPos(tron1.character, 200);
        this.updateCharPos(ghost1.character, 200);
        this.game.physics.arcade.collide(tron1.character, this.layer);
        this.game.physics.arcade.collide(ghost1.character, this.layer);
        this.game.physics.arcade.collide(ghost1.character, tron1.character, collisionHandler, null, this.game);
	
        this.socket.emit('playerMove', JSON.stringify({
            playerId: this.playerId, 
            x: tron1.character.x, 
            y: tron1.character.y
        }));
    }, 

    updateCharPos: function(character, speed) {
        character.body.velocity.x = 0;
        character.body.velocity.y = 0;
        if (character.upKey.isDown) {
            character.animations.play('walkUp', 3, false);
            character.body.velocity.y = -speed;
			if (character == tron1.character){
				emitter1.x = tron1.character.x + 15;
				emitter1.y = tron1.character.y + 35;
			}
			else {
				emitter2.x = ghost1.character.x + 15;
				emitter2.y = ghost1.character.y + 35;
			}
        } else if (character.downKey.isDown) {
            character.animations.play('walkDown', 3, false);
            character.body.velocity.y = speed;
			if (character == tron1.character){
				emitter1.x = tron1.character.x + 15;
				emitter1.y = tron1.character.y - 5;
			}
			else {
				emitter2.x = ghost1.character.x + 15;
				emitter2.y = ghost1.character.y - 5;
			}
        } else if (character.leftKey.isDown) {
            character.animations.play('walkLeft', 3, false);
            character.body.velocity.x = -speed;
            if (character.x < 0) {
                character.x = this.world.width;
            }
			if (character == tron1.character){
				emitter1.x = tron1.character.x + 30;
				emitter1.y = tron1.character.y + 15;
			}
			else{
				emitter2.x = ghost1.character.x + 30;
				emitter2.y = ghost1.character.y + 15;
			}
        } else if (character.rightKey.isDown) {
            character.animations.play('walkRight', 3, false);
            character.body.velocity.x = speed;
            if (character.x > this.world.width) {
                character.x = 0;
            }
			if (character == tron1.character){
				emitter1.x = tron1.character.x;
				emitter1.y = tron1.character.y + 15;
			}
			else {
				emitter2.x = ghost1.character.x;
				emitter2.y = ghost1.character.y + 15;
			}
        }

        return {x: character.x, y: character.y};
    }, 

    pelletHelper: function(mapArray){
//        var pelletArr = [];
        var x = 0;
        var y = 0;
        var pos = 1;
        for(pos = 1; pos < mapArray.length ; pos++){
            if(pos % 32 === 0){
                x = 0;
                y++;
            }
            else
                x++;
            
            if(mapArray[pos] === 0){
                var pellet = this.add.sprite(x*16+2, y*16+2, 'pellet');
                pellet.scale.x = 0.05;
                pellet.scale.y = 0.05;
            }
        }
    },

    updateClientSideListener : function () {
        this.socket.on('playerMove', function(data) {
            data = JSON.parse(data);
            console.log(data);

            if (!this.playerList[data.playerId]) {
                this.playerList[data.playerId] = data;
                this.playerList[data.playerId].tron = new Tron(this, 20, 20, 'tron');
                this.physics.enable(this.playerList[data.playerId].tron, Phaser.Physics.ARCADE);
                // this.playerList[data.playerId].tron.character.body.immovable = true;
                // this.playerList[data.playerId].tron.character.body.collideWorldBounds = true;
                this.playerList[data.playerId].tron.character.scale.x = 0.8;
                this.playerList[data.playerId].tron.character.scale.y = 0.8;
            }

            var player = this.playerList[data.playerId];

            player.tron.character.x = data.x;
            player.tron.character.y = data.y;
        }.bind(this));
    }
};



