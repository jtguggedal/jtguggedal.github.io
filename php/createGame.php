<?php 


	// Fetch paramter form querystring
	$type = $_GET['t'];



	switch ($type) {
		case 'createGame':
			// Create pseudo-unique ID for new game
			generateId();

			break;
		case 'joinGame':
			// Join an already created game
			$joinId = $_GET['id'];
			break;
		default:
			//
			break;
	}



	function generateId() {

		$base = str_split('ABCDEFGHIJKLMNOPQRSTUVWXYZ'); 
		shuffle($base); 
		$id = '';
		foreach (array_rand($base, 5) as $k) 
			$id .= $base[$k];

		$time = time();
		$timeOut = $time + 30;

		echo $id; 
		echo "<br>" . $time;
		echo "<br>" . $timeOut;

		return $id;
	}






?>