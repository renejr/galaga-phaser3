const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
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
let endLevel = 255;

function preload() {
    // Carregar imagens, sons, etc.
    this.load.image('nave', 'assets/images/nave.png');
    this.load.image('playerShot', 'assets/images/playerShot.png');

    //Level Flags
    this.load.image('flagLevelMultiple1', 'assets/images/flagLevelMultiple1.png');
    this.load.image('flagLevelMultiple5', 'assets/images/flagLevelMultiple5.png');
    this.load.image('flagLevelMultiple10', 'assets/images/flagLevelMultiple10.png');
    this.load.image('flagLevelMultiple25', 'assets/images/flagLevelMultiple25.png');
    this.load.image('flagLevelMultiple50', 'assets/images/flagLevelMultiple50.png');
    this.load.image('flagLevelMultiple100', 'assets/images/flagLevelMultiple100.png');
}

function create() {
    // Criar a nave do jogador
    this.player = this.physics.add.sprite(512, 700, 'nave');
    this.player.setOrigin(0.5, 0.5);
    this.player.setScale(2.8);
    this.player.setCollideWorldBounds(true);
    this.player.body.velocity.y = 0;
    this.player.vidas = 3;
    this.player.body.allowGravity = false;

    // Criar sprites para as vidas
    for (let i = 0; i < this.player.vidas; i++) {
        const vida = this.physics.add.sprite(25 + (i * 45), 745, 'nave');
        vida.setScale(2.2);
        vida.setCollideWorldBounds(true);
        vida.body.allowGravity = false;
    }

    // Inicializa o grupo de tiros
    this.player.tiros = this.physics.add.group({
        defaultKey: 'playerShot'
    });

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
    this.levelText = this.add.text(512, 384, `Nível ${startLevel}`, { 
        fontSize: '32px', 
        fill: '#fff',
        fontFamily: 'Arial'
    });
    this.levelText.setOrigin(0.5); // Centralizar o texto

    // Adicionar imagem da flag de nível
    this.levelFlag = this.add.image(512, 745, 'flagLevelMultiple1'); // Imagem inicial
    this.levelFlag.setOrigin(0.5); // Centralizar a imagem
    this.levelFlag.setScale(0.5); // Ajustar a escala (opcional)

    // Controle da nave com teclado
    this.player.cursors = this.input.keyboard.createCursorKeys();
    this.player.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Flag para controlar o disparo
    this.player.podeAtirar = true;

    // Iniciar o efeito de piscar
    this.tweens.add({
        targets: this.levelText,
        alpha: { from: 0, to: 1 },
        duration: 500,
        ease: 'Linear',
        repeat: -1, // Repetir infinitamente
        yoyo: true  // Inverter a animação
    });

}

function atirar(player) {
    if (player.podeAtirar) {
        player.podeAtirar = false;

        const playerTiro = player.tiros.create(player.x, player.y - (32 * 1) + 4, 'playerShot');
        playerTiro.setScale(2.8);
        playerTiro.setVelocityY(-500);
        playerTiro.body.allowGravity = false;
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
}