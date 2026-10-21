<?php
// Cerrar sesión: borra los datos de la sesión y vuelve al inicio de sesión.
session_start();
session_destroy();
header('Location: ../index.html');
