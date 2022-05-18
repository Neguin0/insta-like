const puppeteer = require('puppeteer');
const fs = require('fs');
const cookies = require('./cookies.json');

// Executa a função de start com os argumentos de usuario e senha
start('usuario', '123456');

async function openBrowser() {
	// Abre o navegador
	const browser = await puppeteer.launch({
		// Define para que o navegador abra a janela
		headless: false,
		// Define o tamanho da janela do navegador
		args: [`--window-size=1920,1080`],
		// Define o tamanho do visualizador de páginas
		defaultViewport: {
			width: 1920,
			height: 1080
		},
	});

	// Paginas abertas no navegador
	const pages = await browser.pages();

	// Pega a pagina aberta
	const page = pages[0];

	// Retorna os dados da pagina e do navegador
	return { browser, page };
}

async function start(user, pass) {
	// Pega os dados do navegador e da pagina aberta
	const { browser, page } = await openBrowser();

	// Seta os cookies se tiver a chave do usuario no arquivo cookies.json
	if (cookies?.[user]) await page.setCookie(...cookies[user]);

	// Entra no site
	await page.goto('https://www.instagram.com/');

	// Espera o elemento de login aparecer
	await page.waitForSelector('input[name="username"]', { visible: true, timeout: 5000 })
		.then(async () => {
			// Preenche os campos de usuario e senha
			await login(page, user, pass);

			// Aguarda o carregamento da página
			await page.waitForNavigation()

			// Curte a foto
			await curtirFoto(page, "linkDaFoto");
		})
		// Caso não encontre o elemento de login e porque logou com os dados dos cookies
		.catch(async () => {
			console.log('Logado com a sessão salva!')
			
			// Curte a foto
			await curtirFoto(page, "linkDaFoto");
		});
	
	// Fecha o navegador
	await browser.close();
}

// Função para logar
async function login(page, user, pass) {
	// Preenche os campos de usuario e senha
	await page.type('input[name="username"]', user);
	await page.type('input[name="password"]', pass);

	// Clica no botão de entrar
	await page.click('button[type="submit"]');

	// Espera a pagina carregar
	await page.waitForNavigation()

	// Clica em Salvar Informações
	await page.click('.sqdOP.L3NKy.y3zKF');

	// Salva os cookies da pagina
	await saveCookies(page, user);

	console.log('Logado com login e senha!');
}

// Função para curtir a foto
async function curtirFoto(page, url) {
	// Abre a pagina da postagem
	await page.goto(url);

	// Espera o elemento de curtir aparecer
	await page.waitForSelector('.fr66n', { visible: true });

	// Clica no elemento de curtir
	await page.click('.fr66n');

	console.log('Curtiu a foto!');
}

// Salva os cookies em um arquivo com o usuario
async function saveCookies(page, user) {
	// Pega os cookies da pagina
	newcookies = await page.cookies();

	// Escreve no arquivo cookies.json
	fs.writeFileSync('./cookies.json', JSON.stringify({
		// Pega os dados que ja existe no arquivo
		...cookies,
		// Adiciona os novos dados passando o argumento user como chave
		[user]: newcookies
	}, null, '\t'));

	console.log('Cookies salvas!');

	// Retorna os cookies da pagina para caso queira usar quando for usar esta função
	return newcookies;
}
