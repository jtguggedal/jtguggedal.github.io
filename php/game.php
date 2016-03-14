<?php 
	header('Access-Control-Allow-Origin: *');
	header('Content-type: text/plain; charset=utf-8');
	ini_set('display_errors',1);
	ini_set('display_startup_errors',1);
	error_reporting(E_ALL);
	ini_set('display_errors', 'On');
	// Open database connection
	
	$host = 		"localhost";
	$username = 	"root";
	$password = 	"root";
	$dbname = 		"pwt";

	if($db = new mysqli($host, $username, $password, $dbname));

	$db->set_charset("utf8");


	// Fetch parameters form querystring

	$type = 		querystring("t");
	$timeToJoin = 	querystring('ttj');
	$score = 		querystring('l');
	$gameId = 		querystring('gid');
	$playerId = 	querystring('pid');
	$playerName = 	querystring('pname');

	$function_name = $_GET['callback'];


	switch ($type) {
		case 'create':
			// Create random 5 char ID for new game
			$gameId = createGame();
			$player = new Player($gameId, $playerName, $score, $playerId);
			$player->update($player->gameId, $player->id, $player->score);
			$response = json_encode((array)$player, JSON_UNESCAPED_UNICODE);
			break;
		case 'join':
			// Join an already created game
			$player = new Player($gameId, $playerName);
			$response = joinGame($player, $gameId);
			break;
		case 'u':
			// Update settings for player
			$player = new Player($gameId, $playerName, $score, $playerId);
			$player->update($gameId, $playerId, $score);
			$response = json_encode((array)$player, JSON_UNESCAPED_UNICODE);
		default:
			//
			break;
	}

	//**
	//		Actions
	//**

	// Print the response
	echo "$function_name (\n";
	echo $response;
	echo ");\n";

	//**
	//		Class for player creation. Data is stored in database.
	//**

	class Player {
		public $id;
		public $gameId;
		public $name;
		public $score;
		public $hitsTaken;
		public $countdown;
		public $gameStatus;

		// Public methods

		public function __construct($gameId, $name = 'Joe', $score = 10, $id = "") {
			// Getting the basic information about the player
			if($id == "")
				$this->id = $this->numberOfPlayers($gameId) + 1;
			else
				$this->id = $id;
			$this->gameId = $gameId;
			$this->name = $name;
			$this->score = $score;
			$this->gameStatus = 10;
		}

		public function update($gameId, $playerId, $score) {
			global $db;

			$this->score = $score;

			$playerJsonId = 'player_' . $playerId;
			$playerJson = json_encode($this, JSON_UNESCAPED_UNICODE);
			$sql = "UPDATE game SET $playerJsonId = '$playerJson' WHERE id = '$gameId'";
			$db->query($sql);
		}

		public function getId() {
			return $this->id;
		}

		public function getName() {
			return $this->name;
		}

		public function getscore() {
			return $this->score;
		}

		public function setName($name) {
			return $this->name = $name;
		}

		public function setscore($score) {
			return $this->score = $score;
		}

		// Private methods

		public function numberOfPlayers($gameId) {
			global $db;

			$timeOut = time();

			$sql = "SELECT * FROM game WHERE id = '$gameId'";
			$q = $db->query($sql);
			$r = $q->fetch_assoc();
			$count = 0;

			for($i = 1; $i <= 4; $i++) {
				if($r["player_$i"] != "")
					$count++;
			}

			return $count;
		}

	}

	//**
	// 		Global functions
	//**

	function createGame() {
		global $timeToJoin;
		global $db;
		global $gameId;

		$base = str_split('ABCDEFGHIJKLMNOPQRSTUVWXYZ'); 
		shuffle($base); 
		$id = '';
		foreach (array_rand($base, 5) as $k) 
			$id .= $base[$k];
	
		// Get time and set the timeout for joing the game
		$time = time();
		$timeOut = $time + $timeToJoin;

		// Save game to database
		$sql = "INSERT INTO game (timestamp, timeout, id) VALUES ($time, $timeOut, '$id')";
		$db->query($sql);

		return $id;
	}

	function joinGame($player, $gameId) {
		global $db;

		// Current time to be compared to the game's timeout 
		$time = time();

		// Get information about the game from database
		$sql = "SELECT * FROM game WHERE id = '$gameId'";
		$q = $db->query($sql);

		// Checks if the game exists, returns error if it doesn't
		if($q && $q->num_rows > 0)
			$r = $q->fetch_assoc();
		else
			return 'not_exist';

		// Make sure that the game has not started and is open for new players
		$timeOut = $r['timeout'];
		$toStart = $timeOut - $time;

		$player->countdown = $toStart;

		if($timeOut > $time && $q->num_rows > 0) {
			// Get the number of already registered players and assign playerId
			$id = $player->numberOfPlayers($gameId) + 1;
			$playerName = 'player_' . $id;

			// Player object -> JSON for saving in database
			$playerJson = json_encode($player, JSON_UNESCAPED_UNICODE);

			// Save the new player to the game
			$sql = "UPDATE game SET $playerName = '$playerJson' WHERE id = '$gameId' AND timeout = $timeOut";
			$db->query($sql);

			// Return JSON 
			return $playerJson;

		} else {
			// Return error if the game doesn't exist or if has already started and can't be joined
			return 'started';
		}

	}


	function querystring($k) {
		global $db;

		if(isset($_GET[$k]))
			return $db->real_escape_string($_GET[$k]);
		else
			return "";
	}


	//**
	//		Functions for debugging
	//**

	function testList() {
		global $db;

		$sql = "SELECT * FROM game";
		$response = $db->query($sql);
		$i = 1;
		$list = "";
		while($row = $response->fetch_assoc()) {
			$player = json_decode($row['player_1']);
			if(isset($player->name))
				$list .= $row['timestamp'] . " - " . $player->name . "\n";

			$i++;
		}

		return $list;
	}

	function var_dump_pre($i) {
		echo "<pre>";
		var_dump($i);
		echo "</pre>";
	}


?>