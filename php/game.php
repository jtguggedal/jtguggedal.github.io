<?php 


	// Fetch paramter form querystring
	$type = $_GET['t'];
	$timeToJoin = $_GET['ttj'];



	switch ($type) {
		case 'create':
			// Create pseudo-unique ID for new game
			generateId();

			break;
		case 'join':
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
		$timeOut = $time + $timeToJoin;

		echo $time; 

		return $id;
	}






?>