<?php
require_once 'conexion.php';


$nombre = $_POST['nombre'];
$direccion = $_POST['direccion'];

$sql = "INSERT INTO persona (nombre, direccion) VALUES ('$nombre','$direccion')";

if($con->query($sql)){
    echo trim("ok");
}else{
    echo "error";
}
?>