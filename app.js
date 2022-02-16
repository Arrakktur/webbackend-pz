const express = require("express");
const net = require("net");
const sqlite3 = require('sqlite3').verbose();

const urlencodedParser = express.urlencoded({extended: false});

const app = express();

// Подключение базы данных
let db = new sqlite3.Database('database', (err) => {
	if (err) {
		return console.error(err.message);
	}
	console.log('Connect to the database');
});

// Роутинг основных запросов
app.use(express.static(__dirname + "/dist/"));
app.use("/main", express.static(__dirname + "/dist/"));
app.use("/servers", express.static(__dirname + "/dist/"));
app.use("/mods", express.static(__dirname + "/dist/"));
app.use("/params", express.static(__dirname + "/dist/"));
app.use("/profile", express.static(__dirname + "/dist/"));
app.use("/chat", express.static(__dirname + "/dist/"));

// Обработка запросов на бэкенд
app.post("/control", urlencodedParser, function (request, response) {
	console.log("Запрос: ");
	console.log(request.body);

	if (request.body.command == 'start' ||
		request.body.command == 'stop' ||
		request.body.command == 'getStage' ||
		request.body.command == 'getModName' ||
		request.body.command == 'getModId'){

		// Открываем сокет для отправки на сервер
		let socket = new net.Socket();
		socket.connect(5600, '127.0.0.1', () => {
			socket.write('command=' + request.body.command + '&server=' + request.body.server) // Отправляем запрос на сервер
		});

		// Отправляем ответ от сервера
		socket.on('data', function(data){
			console.log('Ответ отправлен')

			// Заголовки для работы на localhost
			response.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
			response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
			response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requesred-With, Content-type, Accept, x-client-key, x-client-token, x-client-secret, Authorization');
			response.setHeader('Access-Control-Allow-Credentials', true);

			// Отправляем ответ
			response.send(data)

			// Закрываем соединение с фронтом
			socket.end()
		})

		// Закрываем соединение с сервером
		socket.on('end', function() {
			console.log('End connection')
		})
	}

	// Новое сообщение в чате
	else if (request.body.command == 'newMessage'){
		let sql = `INSERT INTO chat(text) VALUES('${request.body.message}')`;
		db.run(sql);
		console.log('new message')
		console.log(request.body.message)
	}

	// Отправляем историю сообщений
	else if (request.body.command == 'getMessage'){
		let sql = `SELECT * FROM chat`;
		db.all(sql, [], (err, rows) => {
			if (err){
				throw err;
			}
			response.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
			response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
			response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requesred-With, Content-type, Accept, x-client-key, x-client-token, x-client-secret, Authorization');
			response.setHeader('Access-Control-Allow-Credentials', true);
			response.send(rows);
		})
	}

	// Авторизация
	else if (request.body.command == 'auth'){
		console.log('Авторизация')
	}
})

app.listen(34853, () => {console.log('server start')});
 