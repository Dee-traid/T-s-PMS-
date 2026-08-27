<?php

class Database{
    private  static $pdo=null;

    public static function getPDOInstance(){
        if(self::$pdo !== null){
            return self::$pdo;
        }

        $host = '';
        $port = '';
        $user = '';
        $dbname = '';
        $password = '';

        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;";

        try{
            self::$pdo = new PDO($dsn, $user, $password);
            self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            return self::$pdo;
        }catch(PDOException $e){
            die("Connection failed: " . $e->getMessage());
        }
        
    }
    
}

?>