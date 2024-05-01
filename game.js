const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let startLevel = 99;
let endLevel = 256;
const spacing = -45; // Defina o valor adequado para o espaçamento entre as flags
const flagX = 900; // Defina o valor adequado para a posição horizontal das flags
const flagY = 745; // Defina o valor adequado para a posição vertical das flags

const flagMap = {
    'I': 'flagLevelMultiple1',
    'V': 'flagLevelMultiple5',
    'X': 'flagLevelMultiple10',
    'XX': 'flagLevelMultiple20',
    'L': 'flagLevelMultiple50',
    'C': 'flagLevelMultiple100',
    // Adicionar novas entradas para D, M, etc.
    'D': 'flagLevelMultiple500', // Exemplo
    'M': 'flagLevelMultiple1000' // Exemplo
};

// Definir uma variável global para contar o número de inimigos vivos
let numEnemiesAlive = 0;

// Definir o número máximo de tiros permitidos na tela
const maxTirosNaTela = 25;

let numTirosDisparados = 0;

function preload() {
    // Carregar imagens, sons, etc.
    this.load.image('nave', 'assets/images/nave.png');
    this.load.image('playerShot', 'assets/images/playerShot.png');

    //Level Flags
    this.load.image('flagLevelMultiple1', 'assets/images/flagLevelMultiple1.png');
    this.load.image('flagLevelMultiple5', 'assets/images/flagLevelMultiple5.png');
    this.load.image('flagLevelMultiple10', 'assets/images/flagLevelMultiple10.png');
    this.load.image('flagLevelMultiple20', 'assets/images/flagLevelMultiple25.png');
    this.load.image('flagLevelMultiple50', 'assets/images/flagLevelMultiple50.png');
    this.load.image('flagLevelMultiple100', 'assets/images/flagLevelMultiple100.png');

    // Carregar o som do tiro
    this.load.audio('somTiro', 'assets/sounds/SOUND07.wav');

    this.load.audio('somExplosaoInimigo', 'assets/sounds/SOUND08.wav');

    this.load.image('galagaRegular01', 'assets/images/GalagaRegular01.png');
    this.load.image('galagaRegular02', 'assets/images/GalagaRegular02.png');
    this.load.image('galagaRegular03', 'assets/images/GalagaRegular03.png');
    this.load.image('galagaRegular04', 'assets/images/GalagaRegular04.png');
    this.load.image('galagaRegular05', 'assets/images/GalagaRegular05.png');
    this.load.image('galagaRegular06', 'assets/images/GalagaRegular06.png');

    this.load.image('galagaBoss01', 'assets/images/GalagaBoss01.png');
    this.load.image('galagaBoss02', 'assets/images/GalagaBoss02.png');
    this.load.image('galagaBoss03', 'assets/images/GalagaBoss03.png');

    this.load.image('galagaFast01', 'assets/images/GalagaFast01.png');

    this.load.spritesheet('enemyExplosion', 'assets/images/enemyExplosion.png', {
        frameWidth: 97/3,
        frameHeight: 22,
        endFrame: 4
    });
}

function arabicToRoman(num) {
    //console.log("num : " + num );

    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '';
    for (let i = 0; i < values.length; i++) {
        while (num >= values[i]) {
            num -= values[i];
            result += numerals[i];
        }
    }
    return result;
}

function getFlagImages(romanNumeral) {
    const flagImages = [];
    let i = 0;
    while (i < romanNumeral.length) {
        // Verificar se há combinações de dois caracteres
        const twoChars = romanNumeral.substring(i, i + 2);
        if (flagMap[twoChars]) {
            flagImages.push(flagMap[twoChars]);
            i += 2;
        } else {
            // Buscar o caractere individual
            const oneChar = romanNumeral.charAt(i);
            flagImages.push(flagMap[oneChar]);
            i++;
        }
    }
    return flagImages;
}



function create() {
    this.physics.world.setBoundsCollision(true, true, true, true);
    
    // Criar a nave do jogador
    this.player = this.physics.add.sprite(512, 700, 'nave');
    this.player.setOrigin(0.5, 0.5);
    this.player.setDepth(5); // Ou um valor maior
    this.player.setScale(2.8);
    this.player.setCollideWorldBounds(true);
    this.player.body.velocity.y = 0;
    this.player.vidas = 3;
    this.player.body.allowGravity = false;

    // Criar sprites para as vidas
    for (let i = 0; i < this.player.vidas; i++) {
        const vida = this.physics.add.sprite(25 + (i * 45), 747, 'nave');
        vida.setScale(2.2);
        vida.setCollideWorldBounds(true);
        vida.body.allowGravity = false;
    }

    // Inicializa o grupo de tiros
    this.player.tiros = this.physics.add.group({
        defaultKey: 'playerShot'
    });

    // Criar o objeto de som do tiro
    this.somTiro = this.sound.add('somTiro');

    // Criar o objeto de som da explosao do inimigo
    this.somExplosaoInimigo = this.sound.add('somExplosaoInimigo');

    // Criar grupo de estrelas com propriedades para animação
    this.estrelas = this.add.group({
        classType: Phaser.GameObjects.Graphics, // Definir tipo de objeto
        maxSize: 100, // Definir tamanho máximo do grupo
        runChildUpdate: true // Habilitar atualização individual de cada estrela
    });

    // Adicionar estrelas com timers e velocidades aleatórias
    for (let i = 0; i < 100; i++) {
        const estrela = this.estrelas.get();
        estrela.fillStyle(0xffff00, 1);
        estrela.fillCircle(0, 0, 1.5);
        estrela.x = Phaser.Math.Between(0, 1024);
        estrela.y = Phaser.Math.Between(0, 650);

        // Definir propriedades para animação
        estrela.timer = Math.random() * 2; // Timer aleatório entre 0 e 2 segundos
        estrela.velocidade = Math.random() < 0.5 ? 0.01 : -0.01; // Velocidade aleatória para frente ou para trás
        estrela.alpha = 0; // Inicialmente invisível
    }

    // Exibir texto do nível
    // Converter nível para romano e exibir
    const levelRoman = arabicToRoman(startLevel);
    this.levelText = this.add.text(512, 384, `Nível ${levelRoman}`, {
        fontSize: '32px', 
        fill: '#fff',
        fontFamily: 'Arial'
    });
    this.levelText.setOrigin(0.5);

    // Obter as imagens de flags para o número romano
    const flagImageNames = getFlagImages(levelRoman);

    // Calcular o deslocamento para centralizar as flags
    const totalFlagWidth = flagImageNames.length * spacing;
    const startX = flagX - (totalFlagWidth / 2) + (spacing / 2);

    for (let i = 0; i < flagImageNames.length; i++) {
        const flagImage = this.add.image(startX + (i * spacing), flagY, flagImageNames[i]);

        flagImage.setOrigin(0.5);
        flagImage.setDepth(5); 
        flagImage.setScale(2.2);
        flagImage.visible = true;
    }

    // Controle da nave com teclado
    this.player.cursors = this.input.keyboard.createCursorKeys();
    this.player.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // hack para add pontos
    // Adicionar tecla P para o hack de pontuação
    this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    // Flag para controlar o disparo
    this.player.podeAtirar = true;

    // Adicionar listener para o evento 'worldbounds'
    this.player.tiros.on('worldbounds', function(tiro) {
        tiro.destroy();
    });

    // Iniciar o efeito de piscar
    this.tweens.add({
        targets: this.levelText,
        alpha: { from: 0, to: 1 },
        duration: 500,
        ease: 'Linear',
        repeat: -1, // Repetir infinitamente
        yoyo: true  // Inverter a animação
    });

    // Inicializar o score
    this.score = 0;

    // Criar o texto do score com a cor amarela
    this.scoreText = this.add.text(512, 747, `Score: ${this.score}`, {
        fontSize: '32px',
        fill: '#ffff00', // Cor amarela
        fontFamily: 'Arial'
    });
    this.scoreText.setOrigin(0.5);

    // Criar o grid
    const cellSize = 64;
    const numCols = Math.ceil(this.sys.game.config.width / cellSize);
    const numRows = Math.ceil(this.sys.game.config.height / cellSize);
    
    // In the create function:
    this.enemies = this.physics.add.group();

    let cellNumber = 1;
    for (let y = 0; y < numRows; y++) {
        for (let x = 0; x < numCols; x++) {
            let cellColor = 0x0000FF; // Default: Blue
            if (cellNumber >= 17 && cellNumber <= 32) {
                cellColor = 0xB00500; // Red for cells 17 to 32
            }
            
            if (cellNumber >= 33 && cellNumber <= 64) {
                cellColor = 0xFFA500; // Orange for cells 32 to 64
            }
            
            if (cellNumber >= 65 && cellNumber <= 80) {
                cellColor = 0x0CC500; // Green for cells 65 to 80
            }

            const cell = this.add.rectangle(x * cellSize, y * cellSize, cellSize, cellSize, cellColor, 0.2); 
            cell.setOrigin(0, 0);
            cell.setDepth(3);

            // Adicionarif (playerTiroPool) número da célula (opcional)
            const cellText = this.add.text(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, cellNumber, {
                fontSize: '8px',
                fill: '#ffffff'
            });

            cellText.setOrigin(0.5, 0.5);
            cellText.setDepth(3);

            if (cellNumber >= 17 && cellNumber <= 80) {
                            // Criar inimigo galagaRegular01 nas células 34 a 39
                if (cellNumber >= 34 && cellNumber <= 39) {
                    const inimigo = this.physics.add.sprite(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 'galagaRegular01');
                    inimigo.customKey = "inimigo" + cellNumber
                    inimigo.setScale(2.5);
                    inimigo.setDepth(4);
                    inimigo.body.allowGravity = false;
                    inimigo.hitValue = 1750;
                    
                    this.enemies.add(inimigo);
                }

                // Criar inimigo2 galagaRegular02 nas células 42 a 47
                if (cellNumber >= 42 && cellNumber <= 47) {
                    const inimigo2 = this.physics.add.sprite(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 'galagaRegular02');
                    inimigo2.customKey = "inimigo2" + cellNumber
                    inimigo2.setScale(2.5);
                    inimigo2.setDepth(4);
                    inimigo2.body.allowGravity = false;
                    inimigo2.hitValue = 1750;

                    this.enemies.add(inimigo2);
                }

                // Criar inimigo3 galagaRegular03 nas células 58 a 62
                if (cellNumber >= 58 && cellNumber <= 62) {
                    const inimigo3 = this.physics.add.sprite(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 'galagaRegular03');
                    inimigo3.customKey = "inimigo3" + cellNumber
                    inimigo3.setScale(2.5);
                    inimigo3.setDepth(4);
                    inimigo3.body.allowGravity = false;
                    inimigo3.hitValue = 550;
                    
                    this.enemies.add(inimigo3);
                }

                // Criar inimigo4 galagaRegular04 nas células 51 a 55
                if (cellNumber >= 51 && cellNumber <= 55) {
                    const inimigo4 = this.physics.add.sprite(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 'galagaRegular04');
                    inimigo4.customKey = "inimigo4" + cellNumber
                    inimigo4.setScale(2.5);
                    inimigo4.setDepth(4);
                    inimigo4.body.allowGravity = false;
                    inimigo4.hitValue = 550;
                    
                    this.enemies.add(inimigo4);
                }

                // Criar inimigo5 galagaRegular05 nas células 68 a 71
                if (cellNumber >= 68 && cellNumber <= 71) {
                    const inimigo5 = this.physics.add.sprite(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 'galagaRegular05');
                    inimigo5.customKey = "inimigo5" + cellNumber
                    inimigo5.setScale(2.5);
                    inimigo5.setDepth(4);
                    inimigo5.body.allowGravity = false;
                    inimigo5.hitValue = 250;
                    
                    this.enemies.add(inimigo5);
                }

                // Criar inimigo6 galagaRegular06 nas células 74 a 77
                if (cellNumber >= 74 && cellNumber <= 77) {
                    const inimigo6 = this.physics.add.sprite(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 'galagaRegular06');
                    inimigo6.customKey = "inimigo6" + cellNumber
                    inimigo6.setScale(2.5);
                    inimigo6.setDepth(4);
                    inimigo6.body.allowGravity = false;
                    inimigo6.hitValue = 250;
                    
                    this.enemies.add(inimigo6);
                }

                // Criar boss1  GalagaBoss01 nas células 17 a 23
                if (cellNumber >= 17 && cellNumber <= 23) {
                    const boss1 = this.physics.add.sprite(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 'galagaBoss01');
                    boss1.customKey = "boss1" + cellNumber
                    boss1.setScale(2.5);
                    boss1.setDepth(4);
                    boss1.body.allowGravity = false;
                    boss1.hitValue = 2500;
                    
                    this.enemies.add(boss1);
                }

                // Criar boss2  GalagaBoss02 nas células 26 a 32
                if (cellNumber >= 26 && cellNumber <= 32) {
                    const boss2 = this.physics.add.sprite(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 'galagaBoss02');
                    boss2.customKey = "boss2" + cellNumber
                    boss2.setScale(2.5);
                    boss2.setDepth(4);
                    boss2.body.allowGravity = false;
                    boss2.hitValue = 2500;
                    
                    this.enemies.add(boss2);
                }

                // Criar boss3  GalagaBoss03 nas células 24 e 56
                if (cellNumber == 24 || cellNumber == 56 ) {
                    const boss3 = this.physics.add.sprite(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 'galagaBoss03');
                    boss3.customKey = "boss3" + cellNumber
                    boss3.setScale(2.5);
                    boss3.setDepth(4);
                    boss3.body.allowGravity = false;
                    boss3.hitValue = 1000;
                    
                    this.enemies.add(boss3);
                }

                // Criar fast1  GalagaFast01 nas células 41 a 73
                if (cellNumber == 41 || cellNumber == 73 ) {
                    const fast1 = this.physics.add.sprite(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 'galagaFast01');
                    fast1.customKey = "fast1" + cellNumber
                    fast1.setScale(2.5);
                    fast1.setDepth(4);
                    fast1.body.allowGravity = false;
                    fast1.hitValue = 5000;
                    
                    this.enemies.add(fast1);
                }  
            }


            cellNumber++;
        }
    }
    
    // Iterar sobre os inimigos e atualizar a contagem de inimigos vivos
    this.enemies.children.iterate(function(enemy) {
        numEnemiesAlive++;
    });

    console.log("num: " + numEnemiesAlive );

    // Animação da explosao do inimigo
    this.anims.create({
        key: 'enemyExplode',
        frames: this.anims.generateFrameNumbers('enemyExplosion', { start: 0, end: 2 }),
        frameRate: 16, // Ajustar a velocidade da animação
        repeat: 0 // Repetir a animação infinitamente
    });

}

function verificarBonusVida(cena) {
    const bonusInterval = 45000; // Intervalo de pontuação para bônus de vida
    const maxVidas = 8; // Número máximo de vidas

    // Calcular quantos bônus de vida o jogador deve receber
    const bonusVidas = Math.floor(cena.score / bonusInterval);

    // Garantir que o número de vidas não exceda o máximo
    const vidasAdicionar = Math.min(bonusVidas - (cena.player.vidas - 3), maxVidas - cena.player.vidas);

    // Adicionar as vidas extras
    for (let i = 0; i < vidasAdicionar; i++) {
        cena.player.vidas++;

        // Criar um novo sprite de vida
        const vida = cena.physics.add.sprite(25 + (cena.player.vidas - 1) * 45, 747, 'nave');
        vida.setScale(2.2);
        vida.setCollideWorldBounds(true);
        vida.body.allowGravity = false;
    }
}

function avancarParaProximoNivel(gameState, cena) {
    // Incrementar o valor do nível
    startLevel++;

    console.log("Estado atual do jogo:");
    Object.keys(gameState).forEach(key => {
        console.log(`${key}: ${gameState[key]}`);
    });

    // Aqui você pode acessar as informações do gameState, como gameState.level, gameState.score, gameState.playerLives, etc.
    if (gameState.playerLives >= 1) {
        // Verificar se o novo nível excede o valor máximo
        if (startLevel > endLevel) {
            // Se sim, ajustar o valor máximo do nível
            endLevel = startLevel;
        }

        console.log("gPL: " + gameState.playerLives);
        console.log("gLe: " + gameState.level);
        console.log("startLevel: " + startLevel);
        console.log("endLevel: " + endLevel);

        // Converter o novo número de nível para algarismos romanos
        const newLevelRoman = arabicToRoman(startLevel);

        // Exibir o novo número de nível no jogo
        console.log(`Avançando para o próximo nível: ${newLevelRoman}`);

        // Atualizar as imagens das bandeiras para o novo número de nível
        const newFlagImageNames = getFlagImages(newLevelRoman);

        // Calcular o deslocamento para centralizar as novas bandeiras
        const totalFlagWidth = newFlagImageNames.length * spacing;
        const startX = flagX - (totalFlagWidth / 2) + (spacing / 2);

        // Criar e exibir as novas bandeiras
        for (let i = 0; i < newFlagImageNames.length; i++) {
            const flagImage = cena.add.image(startX + (i * spacing), flagY, newFlagImageNames[i]);
            flagImage.setOrigin(0.5);
            flagImage.setDepth(5); 
            flagImage.setScale(2.2);
            flagImage.visible = true;
        }
    }
}

function update() {
    if (this.player.cursors.left.isDown) {
        this.player.setVelocityX(-250);
    } else if (this.player.cursors.right.isDown) {
        this.player.setVelocityX(250);
    } else {
        this.player.setVelocityX(0);
    }

    // Armazenar o contexto atual
    const self = this; 

    // Adicionar uma verificação para permitir o disparo apenas quando pelo menos 40% dos tiros já foram destruídos
    if (this.player.spacebar.isDown && this.player.podeAtirar) {

        atirar(this.player);

    }

    // Habilita o disparo novamente quando a tecla é solta
    if (this.player.spacebar.isUp) {
        this.player.podeAtirar = true;
    }

    // Animar estrelas individualmente
    this.estrelas.children.iterate(function(estrela) {
        estrela.timer += estrela.velocidade * 5; 
        estrela.alpha = Math.abs(Math.sin(estrela.timer)); // Alternar alpha com base no seno do timer
    });

    // Verificar se o jogador se moveu ou atirou
    if (this.player.body.velocity.x !== 0 || !this.player.podeAtirar) {
        // Parar o efeito de piscar e destruir o texto
        this.tweens.killTweensOf(this.levelText);
        this.levelText.destroy();
    }    

    // hacks para debug do jogo
    // Verificar se a tecla P foi pressionada
    if (this.keyP.isDown) {
        this.score += 1000;
        this.scoreText.setText(`Score: ${this.score}`); // Atualizar a exibição do score

        // Verificar bônus de vida após atualizar o score
        verificarBonusVida(this); // Passar o contexto da cena (this) como argumento
    }

    // Variável para controlar o estado de pausa
    let isPaused = false;

    // Verificar se a tecla 'Q' foi pressionada
    if (this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q).isDown) {
        if (!isPaused) {
            // Pausar o jogo
            console.log('O jogo foi pausado.');
            this.physics.pause();
            isPaused = true;
        } else {
            // Retomar o jogo
            console.log('O jogo foi retomado.');
            this.physics.resume();
            isPaused = false;
        }
    }



    this.physics.add.overlap(this.player.tiros, this.enemies, (tiro, inimigo) => {
        tiro.destroy(); // Destruir o tiro
        
        // Verificar se o inimigo possui a propriedade customKey e destruí-lo com base nessa referência
        if (inimigo.customKey) {
            // Criar a explosão na posição do inimigo
            const explosao = this.add.sprite(inimigo.x, inimigo.y, 'enemyExplosion');
            explosao.setDepth(5); // Definir a profundidade acima do inimigo
            explosao.play('enemyExplode'); // Iniciar a animação

            self.somExplosaoInimigo.play();

            // Destruir o inimigo após um pequeno delay para permitir que a animação seja visível
            this.time.delayedCall(100, () => { // Ajustar o delay conforme necessário
                inimigo.destroy();

                // Atualizar a contagem de inimigos vivos
                numEnemiesAlive--;

                //console.log("num2: " + numEnemiesAlive );

                // Verificar se todos os inimigos foram destruídos
                if (numEnemiesAlive === 0) {
                   // this.flagImage.destroy();
                    // Todos os inimigos foram destruídos, avançar para o próximo nível ou realizar outra ação
                    avancarParaProximoNivel({
                        level: startLevel,
                        score: this.score,
                        playerLives: this.player.vidas
                        // Outras informações do estado do jogo, se necessário
                    }, this)
                }

                // Atualizar a pontuação
                this.score += inimigo.hitValue;
                this.scoreText.setText(`Score: ${this.score}`);

                // Verificar bônus de vida após a atualização da pontuação
                verificarBonusVida(this);

                // Destruir a explosão após um período de tempo
                this.time.delayedCall(100, () => { // Tempo em milissegundos (1000 ms = 1 segundo)
                    explosao.destroy();
                });
            });
        }
    }, null, this);
    
    function atirar(player) {        
        if (player.podeAtirar) {
            player.podeAtirar = false;
    
            // Reproduzir o som do tiro
            self.somTiro.play();
    
            const playerTiro = player.tiros.create(player.x, player.y - (32 * 1) + 4, 'playerShot');
            playerTiro.setScale(2.8);
            playerTiro.setVelocityY(-500);
            playerTiro.body.allowGravity = false;
        }
    }
    
}