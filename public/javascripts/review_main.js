/// <reference path="../index.html" />
/// <reference path="libs/jquery-2.1.0-vsdoc.js" />
/// <reference path="libs/hand-1.3.8.js" />
var review = review || {};
( function ( review, $ ) {
    var pages = [
        {
            name: 'splansh',
            enter: function ( callback ) {
                callback();
            },
            leave: function ( callback ) {

            }
        }
    ];

    var switchPage = function () {
        function switchProxy( to ) {
            function openPage( id, callback ) {
                callback = callback || function () { };
                pages[id].enter( callback );
            }
            function closePage( id, callback ) {
                callback = callback || function () { };
                pages[id].leave( callback );
            }
            if ( currentPage === -1 ) {
                //initial page
                currentPage = 0;
                openPage( to );
                return;
            }
            closePage( currentPage, function () {
                openPage( currentPage );
            } );
            currentPage = to;
            return;
        }
        switchProxy.switchNext = function () {
            if ( currentPage < pages.length - 2 ) {
                switchProxy( currentPage + 1 );
            }
        };
        switchProxy.switchPrevious = function () {
            if ( currentPage > 0 ) {
                switchProxy( currentPage - 1 );
            }
        }
        return switchProxy;
    }();
    // -1 indecating the initial load
    var currentPage = -1;

    $( function () {
        //Bind events handler;
        var touchPos = 0;
        var musicload = false;
        var musicPlayed = false;
        var musicDom = document.getElementById( 'music' );
        $( window ).bind( 'pointerdown', function ( e ) {
            if ( !musicload ) {
                musicDom.load();
                musicload = true;
            }
            touchPos = e.clientY;
        } ).bind( 'pointermove', function ( e ) {
        } ).bind( 'pointerup', function ( e ) {
            if ( e.clientY - touchPos > 30 ) {
                switchPage.switchNext();
            } else if ( e.clientY - touchPos < -30 ) {
                switchPage.switchPrevious();
            }
        } );

        $( window ).scroll( function ( e ) {
            if ( !musicPlayed && $( '#nothing' ).offset()['top'] - $( document ).scrollTop() < 20 ) {
                document.getElementById( 'music' ).play();
                musicPlayed = true;
            }

        } )


        //initialize
        $( '#splansh-word' )

        //Start first page.
        switchPage( 0 );
    } );
} )( review, jQuery );