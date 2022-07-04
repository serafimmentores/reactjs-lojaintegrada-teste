/**
 * Arquivo de comportamento do Gulp para automatizar as compilações de front para
 * o tema Puro de Loja Integrada
 *
 * Eng. de Software: Vento Macedo
 * E-mail: rafa.osbourne@gmail.com / vento@tadah.xyz - 41 99503-3349
 * Data: 13.10.2021
 **/

import env from 'dotenv';
import gulp from 'gulp';
import gutil from 'gutil';
import ftp from 'vinyl-ftp';

//  const env = require('dotenv');
//  const gulp = require('gulp');
//  const gutil = require('gutil');
//  const ftp = require('vinyl-ftp');

import concat from 'gulp-concat';
import uglify from  'gulp-uglify-es';
import htmlmin from 'gulp-htmlmin';

//  const concat = require('gulp-concat');
//  const uglify = require('gulp-uglify-es').default
//  let htmlmin = require('gulp-htmlmin');
 
import notify from 'gulp-notify';
import plumber from 'gulp-plumber';
import gulpif from 'gulp-if';


//  const notify = require('gulp-notify');
//  const plumber = require('gulp-plumber');
//  const gulpif = require('gulp-if');

import sass from 'gulp-sass';
import cssnano from 'gulp-cssnano';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'autoprefixer';

//  const sass = require('gulp-sass')
//  const cssnano = require('gulp-cssnano');
//  const postcss = require('gulp-postcss');
//  const sourcemaps = require('gulp-sourcemaps');
//  const autoprefixer = require('autoprefixer');

import browserSync from 'browser-sync';

browserSync.create();
env.config(); // Get Env values
 
 /** Set configs **/
 const config = {
     project: process.env.PROJECT,
     production: (process.env.PRODUCTION === 'true'),
     ftp: {
         host: process.env.HOST,
         port: parseInt(process.env.PORT),
         ftpUser: process.env.FTP_USER,
         password: process.env.FTP_PASS
     }
 };
 
 /** Error catcher **/
 let plumberErrorHandler = {
     errorHandler: notify.onError({
         title: { title: 'Gulp feedback' },
         message: "Error: <%= error.message %>"
     })
 };
 
 /** Paths **/
 const origin = {
     js: ['src/**/*.js'],
     css: ['src/**/*.css'],
     ftp: ['build/scripts.min.js', 'build/style.min.css']
 }
 
 const destiny = {
     js: 'build/',
     css: 'build/',
     html: 'build/',
     ftp: `/${config.project}/`
 }
 
 /** Get FTP Connection **/
 const getFtpConnection = () => {
     return ftp.create({
         host: config.ftp.host,
         port: config.ftp.port,
         user: config.ftp.ftpUser,
         password: config.ftp.password,
         debug: (d) => !config.production && console.log(d),
         log: gutil.log,
         parallel: 5,
         reload: true,
     });
 }
 
 /** Send Files fo FTP **/
 const sendFTP = () => {
     const connection = getFtpConnection();
     return gulp.src(origin.ftp, { base: '.', buffer: false })
         .pipe(plumber(plumberErrorHandler))
         .pipe(connection.dest(destiny.ftp));
 };
 
 /** Script to JS Vanilla **/
 const javascript = () => {
     return gulp.src(origin.js)
         .pipe(plumber(plumberErrorHandler))
         .pipe(concat('scripts.min.js'))
         .pipe(gulpif(!config.production, sourcemaps.init()))
         .pipe(gulpif(!config.production, sourcemaps.write()))
         .pipe(gulpif(config.production, uglify()))
         .pipe(gulp.dest(destiny.js))
         .pipe(browserSync.stream());
 };
 
 /** Script to SASS **/
 const css = () => {
     return gulp.src(origin.sass)
         .pipe(plumber(plumberErrorHandler))
         .pipe(concat('style.min.css'))
         .pipe(sass.sync())
         .pipe(postcss([autoprefixer()]))
         .pipe(gulpif(config.production, cssnano({
             zindex: false
         })))
         .pipe(gulpif(!config.production, sourcemaps.init()))
         .pipe(gulpif(!config.production, sourcemaps.write()))
         .pipe(gulp.dest(destiny.sass))
         .pipe(browserSync.stream());
 };
 
 /** Script to HTML **/
 const html = () => {
     return gulp.src(origin.html)
         .pipe(gulpif(config.production, htmlmin({ collapseWhitespace: true, removeComments: true })))
         .pipe(gulp.dest('build'));
 }
 
 /**  Tasks **/
 // App Server
 gulp.task('server', () => connect.server());
 
 // Run Dev (start)
 gulp.task('default', () => {
     console.log('\x1b[33m', '\nCompilando em modo desenvolvedor');
     console.log('\x1b[32m', '\nPressione Control + C para sair\n');
     console.log('\x1b[37m', '\n');
 
     // browserSync.init({  server: { baseDir: './' } });
 
     // Process files
     gulp.watch('src/**/*.js', javascript);
     gulp.watch('src/**/*.css', css);
     gulp.watch('src/**/*.html', html);
 
     // Send to FTP
     gulp.watch('build/**/*', sendFTP);
 
     // Browser reload
     // gulp.watch('./**/*').on('change', browserSync.reload);
 
 });
 
 // Run Prod (build)
 gulp.task('production', async () => {
 
     console.log('\x1b[33m', '\nCompilando para produção...');
     console.log('\x1b[37m', '\n');
 
     javascript();
     console.log('\x1b[33m', 'Compilando JS');
 
     css();
     console.log('\x1b[33m', 'Compilando CSS');
 
     html();
     console.log('\x1b[33m', 'Compilando HTML');
 
     sendFTP();
     console.log('\x1b[33m', 'Enviando para o Servidor via FTP');
 
 });