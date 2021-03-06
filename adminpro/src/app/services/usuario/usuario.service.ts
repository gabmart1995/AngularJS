import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { URL_SERVICIOS } from './../../config/config';

import { Usuario } from './../../models/usuario.models';

import { throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';  // importacion correcta del archivo

import { SubirArchivoService } from '../subir-archivo/subir-archivo.service';



@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  // variables que me indican si esta logueado
  usuario: Usuario;
  token: string;
  menu: any = [];

  constructor(
      public http: HttpClient,
      public router: Router,
      public _subirArchivoSevice: SubirArchivoService
    ) {

    // carga los datos dentro del navegador
    this.cargarStorage();
   }

  // identifica si el usuario esta logueado
  estaLogueado() {
    return (this.token.length > 5) ? true : false;
  }

  // carga el localStorage y lo asigna a la variable
  cargarStorage() {

    if (localStorage.getItem('token')) {

      this.token = localStorage.getItem('token');
      this.usuario = JSON.parse(localStorage.getItem('usuario'));
      this.menu = JSON.parse( localStorage.getItem( 'menu' ) );

    }
    else {

      this.token = '';
      this.usuario = null;
      this.menu = [];
    }
  }

  // guarda el usuario en el storage recibe 3 parametros
  guardarStorage(id: string, token: string, usuario: Usuario, menu: any) {

    localStorage.setItem('id', id);
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify( usuario ));
    localStorage.setItem('menu', JSON.stringify( menu ));

    // asigna los valores dentro de los valores
    this.usuario = usuario;
    this.token = token;
    this.menu = menu;

  }

  crearUsuario(usuario: Usuario) {

    // se construye la peticion url al servidor
    let url = URL_SERVICIOS + '/usuario';

    // retorna un observador con las respuestas
    return this.http.post(url, usuario).pipe(
      map((response: any) => {
        swal('Usuario Creado', usuario.email, 'success');
        return response.usuario;
      }),

      catchError( error => {
        swal( error.error.mensaje, error.error.errors.message, 'error' );
        return throwError( error );
      })

    );
  }

  actualizarUsuario(usuario: Usuario) {

    // se arma la url
    let url = URL_SERVICIOS + '/usuario/' + usuario._id;
    url += '?token=' + this.token;

    return this.http.patch(url, usuario).pipe(
      map((response: any) => {

        if ( usuario._id === this.usuario._id ) {

          let usuarioDB: Usuario = response.usuario;

          this.guardarStorage(
            usuarioDB._id,
            this.token,
            usuarioDB,
            this.menu );
        }

        swal('Usuario actualizado', usuario.nombre, 'success');
        return true;

      }),

      catchError( error => {
        swal( error.error.mensaje, error.error.errors.message, 'error' );
        return throwError( error );
      })
    );
  }

  loginGoogle(token: string) {

    // genera la URL y se conecta con el Backend
    let url = URL_SERVICIOS + '/login/google';

    return this.http.post(url, { token }).pipe(
      map((response: any) => {

        // llama a la fuucion gaurdar storage
        this.guardarStorage(
          response.id,
          response.token,
          response.usuario,
          response.menu );

        return true;
      })
    );
  }

  login(usuario: Usuario, recordar: boolean = false) {

    // si recuerdame es true almacena en el localStorage
    if (recordar)  {
      localStorage.setItem('email', usuario.email);
    }
    else {
      localStorage.removeItem('email');
    }

    // define la URL
    let url = URL_SERVICIOS + '/login';

    return this.http.post(url, usuario).pipe(
      map((response: any) => {

        // ejecuta la funcion y guarda en el localStorage
        this.guardarStorage(
          response.id,
          response.token,
          response.usuario,
          response.menu );

        return true;
      }),

      catchError( error => {
        swal( 'Error en el login', error.error.mensaje, 'error' );
        return throwError( error );
      })

    );
  }

  // salida del usuario
  logout() {

    // vacia las variables
    this.usuario = null;
    this.token = '';
    this.menu = [];

    // remueve los elementos por el usuario
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem( 'menu' );

    // redirecciona al login
    this.router.navigate(['/login']);
  }

  cambiarImagen(archivo: File, id: string) {

    this._subirArchivoSevice.subirArchivo(archivo, 'usuarios', id)
      .then((response: any) => {

        // cambia la imagen del usuario
        this.usuario.img = response.usuario.img;
        swal('Imagen actualizada', this.usuario.nombre, 'success');

        // actualiza el storage
        this.guardarStorage( id, this.token, this.usuario, this.menu );
      })
      .catch(response => {
        console.log(response);
      });
  }

  cargarUsuarios(desde: number = 0) {

    let url = URL_SERVICIOS + '/usuario?desde=' + desde;

    return this.http.get(url);
  }

  // funcion que ayuda a buscar los usuario
  buscarUsuarios( termino: string ) {

    let url = URL_SERVICIOS + '/busqueda/coleccion/usuarios/' + termino;

    return this.http.get( url )
      .pipe(
        map((response: any) => response.usuarios )
      );
  }

  borrarUsuario( id: string ) {

    let url = URL_SERVICIOS + '/usuario/' + id;
    url += '?token=' + this.token;

    return this.http.delete( url )
      .pipe(
        map( response => {
          swal( 'Usuario Borrado', 'El usuario ha sido eliminado correctamente', 'success' );
          return true;
        })
    );
  }
}
