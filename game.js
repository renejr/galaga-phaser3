const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
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

let startLevel = 1;
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
}

function arabicToRoman(num) {
    console.log("num : " + num );

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

    const self = this; // Armazenar o contexto atual

    // Criar grupo de estrelas
    this.estrelas = this.add.group();

    // Adicionar 100 estrelas
    for (let i = 0; i < 100; i++) {
        // Criar objeto gráfico para a estrela
        const estrela = this.add.graphics();
        estrela.fillStyle(0xffff00, 1); // Cor amarela
        estrela.fillCircle(0, 0, 1.5); // Desenhar círculo 
        // Posicionar aleatoriamente
        estrela.x = Phaser.Math.Between(0, 1024);
        estrela.y = Phaser.Math.Between(0, 650);
        // Adicionar ao grupo
        this.estrelas.add(estrela);
        // Definir visibilidade inicial (opcional)
        estrela.visible = Math.random() < 0.5;
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

}

function atirar(player) {
    if (player.podeAtirar) {
        player.podeAtirar = false;

        const playerTiro = player.tiros.create(player.x, player.y - (32 * 1) + 4, 'playerShot');
        playerTiro.setScale(2.8);
        playerTiro.setVelocityY(-500);
        playerTiro.body.allowGravity = false;

        // Reproduzir o som do tiro usando o contexto da cena
        self.somTiro.play(); 
    }
}

function verificarBonusVida(cena) {
    const bonusInterval = 70000; // Intervalo de pontuação para bônus de vida
    const maxVidas = 10; // Número máximo de vidas

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

    function atirar(player) {
        if (player.podeAtirar) {
            player.podeAtirar = false;

            const playerTiro = player.tiros.create(player.x, player.y - (32 * 1) + 4, 'playerShot');
            playerTiro.setScale(2.8);
            playerTiro.setVelocityY(-500);
            playerTiro.body.allowGravity = false;

            // Reproduzir o som do tiro usando o contexto da cena
            self.somTiro.play(); 
        }
    }

    if (this.player.spacebar.isDown && this.player.podeAtirar) {
        atirar(this.player);
    }

    // Habilita o disparo novamente quando a tecla é solta
    if (this.player.spacebar.isUp) {
        this.player.podeAtirar = true;
    }

    // Animar estrelas
    this.estrelas.children.iterate(function(estrela) {
        // Timer aleatório para cada estrela
        if (Math.random() < 0.02) {
        // Alternar visibilidade
        estrela.visible = !estrela.visible;
        }
    });

    // Verificar se o jogador se moveu ou atirou
    if (this.player.body.velocity.x !== 0 || !this.player.podeAtirar) {
        // Parar o efeito de piscar e destruir o texto
        this.tweens.killTweensOf(this.levelText);
        this.levelText.destroy();
    }    

        // hacks
    // Verificar se a tecla P foi pressionada
    if (this.keyP.isDown) {
        this.score += 1000;
        this.scoreText.setText(`Score: ${this.score}`); // Atualizar a exibição do score
    }

    // Verificar bônus de vida após atualizar o score
    verificarBonusVida(this); // Passar o contexto da cena (this) como argumento


}