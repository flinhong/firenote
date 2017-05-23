$(document)
  .ready(function() {
    $('.ui.menu .ui.dropdown').dropdown({
      on: 'hover'
    });

    $("#new-note").click(function() {
        $("#new-modal").modal('setting', 'transition', 'vertical flip').modal('show');
    });

    $("#new-modal .actions").click(function() {
        var notename = $("#new-modal input[name='note name']").val();
        var notebook = $("#new-modal input[name='notebook']").val();
        if (notename) {
            $("#file-info input").val(notename);
        } else {
            notename = prompt("Please enter a new note name", "Note Name");
            $("#file-info input").val(notename);
        }
        if (notebook) {
            $("#notebook-info .text").text(notebook);
        } else {
            $("#notebook-info .text").text("Default Notebook");
        }
        mainEditor.cm.setValue("");
    });    

    // Initialize Firebase
    var config = {
    apiKey: "AIzaSyBXiYAPGOYyg25soKJNjMk3nIvWUPLd6uQ",
    authDomain: "markdown-14046.firebaseapp.com",
    databaseURL: "https://markdown-14046.firebaseio.com",
    projectId: "markdown-14046",
    storageBucket: "markdown-14046.appspot.com",
    messagingSenderId: "254678611694"
    };
    firebase.initializeApp(config);

    var databaseRef = firebase.database().ref();
    var storageRef = firebase.storage().ref();
    var provider = new firebase.auth.GoogleAuthProvider();
    var userID;
    var userName;
    var noteContent;

    provider.addScope('https://www.googleapis.com/auth/plus.login');

    $("#signin").click(function() {
        firebase.auth().signInWithPopup(provider);
    });

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            userName = user.displayName;
            userID = user.uid;
            var photoUrl = user.photoURL;
            $(".right a .google").toggle();
            $("#signout span").text(userName);
            $("#signout a").prepend("<img src='" + photoUrl + "'>");
            $("#signout a").append('<i class="sign out icon"></i>');
            $("#signin").toggle();
            $("#signout").toggle();
            $("#open-note").removeClass("disabled");
            $("#save-note").removeClass("disabled");
            $("#notebook-info").toggle();
            var notesdataRef = databaseRef.child(userID);
            updateNoteList(notesdataRef);
            $(window).bind('keydown', function(event) {
                if (event.ctrlKey || event.metaKey) {
                    switch (String.fromCharCode(event.which).toLowerCase()) {
                    case 's':
                        event.preventDefault();
                        $("#uploading").addClass("active");
                        noteContent = $("#noteContent").text();
                        var timeStamp = new Date().toLocaleString();
                        var file = new Blob([noteContent], { type: "text/plain" });
                        var fileName = $("#file-info input").val();

                        if (fileName) {

                        } else {
                            fileName = prompt("Please enter a new note name", "Note Name:");
                        }

                        var fileNameExt = $("#file-info input").val() + ".md";
                        var notebook = $("#notebook-info .text").text();
                        var notedataRef;
                        var notefileRef;

                        if (notebook) {
                
                        } else {
                            notebook = "Default Notebook";
                        }

                        notedataRef = databaseRef.child(userID).child(notebook).child(fileName);
                        notefileRef = storageRef.child(userID).child(notebook).child(fileNameExt);

                        notedataRef.once('value', function(snapshot) {
                            var exists = (snapshot.val() !== null);
                            if (exists) {
                                updateFile();
                            } else {
                                uploadFile();
                            }
                            var notesdataRef = databaseRef.child(userID);
                            updateNoteList(notesdataRef);
                        });

                        function uploadFile() {
                            notedataRef.set({
                                filename: fileName,
                                updateAt: timeStamp
                            });
                            var uploadTask = notefileRef.put(file);

                            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, function(snapshot) {
                                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                $('.indicator').animate({width: progress +'%'}, 400);
                            }, function(error) {

                            }, function() {
                                // Upload completed successfully, now we can get the download URL
                                // var downloadURL = uploadTask.snapshot.downloadURL;
                                $('.indicator').animate({width:0}, 1);
                                $("#uploading").removeClass("active");
                                $("#delete-note").removeClass("disabled");                        
                            });                    
                        };

                        function updateFile() {
                            notefileRef.delete().then(function() {
                                uploadFile();
                            }).catch(function(error) {
                            // Uh-oh, an error occurred!
                            });
                        }
                        break;
                    case 'o':
                        event.preventDefault();
                        $("#open-modal").modal('setting', 'transition', 'vertical flip').modal('show');
                        $("#note-list .item a").each(function() {
                            $(this).on("click", function() {
                                $("#open-modal .dimmer").addClass("active");
                                var noteName = $(this).text();
                                var noteNameExt = noteName + ".md";
                                var notebook = $(this).closest(".tab").attr("data-tab");
                                var notefileRef = storageRef.child(userID).child(notebook).child(noteNameExt);
                                notefileRef.getDownloadURL().then(function(url) {
                                    var jQxhr = $.get(url, function(data){
                                        mainEditor.cm.setValue(data);
                                        $("#file-info input").val(noteName);
                                        $("#notebook-info .text").text(notebook);
                                        $("#open-modal .dimmer").removeClass("active");
                                        $("#open-modal").modal('hide');
                                        $("#delete-note").removeClass("disabled");                 
                                    });
                                }).catch(function(error) {
                                // Handle any errors
                                });
                            });
                        });
                        break;
                    case 'g':
                        event.preventDefault();
                        alert('ctrl-g');
                        break;
                    }
                }
            });                             
        }
    });

    function updateNoteList(notesdataRef) {
        $("#notebook-list").empty();
        $("#note-list").empty();
        $("#notebook-info .scrolling").empty();
        notesdataRef.once("value").then(function(snapshot) {
            var notebooks = snapshot.val();

            $.each(notebooks, function(notebook, notesData) {
                var notebookhtml = '<div class="item" data-tab="' + notebook + '"><i class="fa fa-lg fa-folder-o"></i>' + notebook + '</div>';
                var notebookhtml1 = '<div class="item">' + notebook + '</div>';
                $("#notebook-list").append(notebookhtml);
                $("#notebook-info .scrolling").append(notebookhtml1);

                var notetab = '<div class="ui tab" data-tab="' + notebook + '">';
                notetab += '<div class="ui relaxed divided list">';
                var notetabinner = '';
                $.each(notesData, function(note, noteinfo) {
                    var innerhtml = '<div class="item"><i class="large file text outline middle aligned icon"></i><div class="content">';
                    innerhtml += '<a class="header">' + noteinfo.filename + '</a>';
                    innerhtml += '<div class="description">Last update: ' + noteinfo.updateAt + '</div></div></div>';
                    notetabinner += innerhtml;
                });
                notetab += notetabinner + '</div></div>';
                $("#note-list").append(notetab);
            });
            
            $('#notebook-list').children(":first").addClass("active");
            $('#note-list').children(":first").addClass("active");
            $('.tabular.menu .item').tab();
        });
    };

    $("#signout").click(function() {
        firebase.auth().signOut().then(function() {
            $(".right a .google").toggle();
            $("#signin").toggle();
            $("#signout").toggle();
            $("#file-info input").val("");
            $("#notebook-info").toggle();
            $("#notebook-list").empty();
            $("#note-list").empty();            
        }, function(error) {
        // An error happened.
        });
    });    

   $("#delete-note").click(function() {
        var notebook = $("#notebook-info .text").text();;
        var noteName = $("#file-info input").val();;
        var noteNameExt = noteName + ".md";
        databaseRef.child(userID).child(notebook).child(noteName).remove();
        storageRef.child(userID).child(notebook).child(noteNameExt).delete();
        updateNoteList(databaseRef.child(userID));
        mainEditor.cm.setValue("");
    });

    $("#open-note").click(function() {
        $("#open-modal").modal('setting', 'transition', 'vertical flip').modal('show');
        $("#note-list .item a").each(function() {
            $(this).on("click", function() {
                $("#open-modal .dimmer").addClass("active");
                var noteName = $(this).text();
                var noteNameExt = noteName + ".md";
                var notebook = $(this).closest(".tab").attr("data-tab");
                var notefileRef = storageRef.child(userID).child(notebook).child(noteNameExt);
                notefileRef.getDownloadURL().then(function(url) {
                    var jQxhr = $.get(url, function(data){
                        mainEditor.cm.setValue(data);
                        $("#file-info input").val(noteName);
                        $("#notebook-info .text").text(notebook);
                        $("#open-modal .dimmer").removeClass("active");
                        $("#open-modal").modal('hide');
                        $("#delete-note").removeClass("disabled");                    
                    });
                }).catch(function(error) {
                // Handle any errors
                });
            });
        });
    });

    $("#save-note").click(function() {
        $("#uploading").addClass("active");
        var noteContent = $("#noteContent").text();
        var timeStamp = new Date().toLocaleString();
        var file = new Blob([noteContent], { type: "text/plain" });
        var fileName = $("#file-info input").val();

        if (fileName) {

        } else {
            fileName = prompt("Please enter a new note name", "Note Name:");
        }

        var fileNameExt = $("#file-info input").val() + ".md";
        var notebook = $("#notebook-info .text").text();
        var notedataRef;
        var notefileRef;

        if (notebook) {
  
        } else {
            notebook = "Default Notebook";
        }

        notedataRef = databaseRef.child(userID).child(notebook).child(fileName);
        notefileRef = storageRef.child(userID).child(notebook).child(fileNameExt);

        notedataRef.once('value', function(snapshot) {
            var exists = (snapshot.val() !== null);
            if (exists) {
                updateFile();
            } else {
                uploadFile();
            }
            var notesdataRef = databaseRef.child(userID);
            updateNoteList(notesdataRef);
        });

        function uploadFile() {
            notedataRef.set({
                filename: fileName,
                updateAt: timeStamp
            });
            var uploadTask = notefileRef.put(file);

            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, function(snapshot) {
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                $('.indicator').animate({width: progress +'%'}, 400);
            }, function(error) {

            }, function() {
                // Upload completed successfully, now we can get the download URL
                // var downloadURL = uploadTask.snapshot.downloadURL;
                $('.indicator').animate({width:0}, 1);
                $("#uploading").removeClass("active");
                $("#delete-note").removeClass("disabled");                     
            });                    
        };

        function updateFile() {
            notefileRef.delete().then(function() {
                uploadFile();
            }).catch(function(error) {
            // Uh-oh, an error occurred!
            });
        }

    });

  })
;

var mainEditor;
      
function themeSelect(id, themes, lsKey, callback)
{
    var select = $("#" + id);
    for (var i = 0, len = themes.length; i < len; i ++)
    {                    
        var theme = themes[i];  
        select.append("<div class='item'>" + theme + "</div>");
    }
    select.children().click(function(){
        var theme = $(this).text();
        if (theme === "")
        {
            alert("theme == \"\"");
            return false;
        }        
        localStorage[lsKey] = theme;
        callback(select, theme);             
    });
    return select;
}

$(function() {                
    mainEditor = editormd("editormd", {
        width : "100%",
        codeFold : true,
        saveHTMLToTextarea : true,
        searchReplace : true,
        emoji : true,
        taskList : true,
        tocm : true,
        tex : true,
        flowChart : true,
        sequenceDiagram : true,

        toolbarIcons : function() {
            // Or return editormd.toolbarModes[name]; // full, simple, mini
            // Using "||" set icons align right.
            return ["undo", "redo", "|", "bold", "del", "italic", "quote", "ucwords", "uppercase", "lowercase", "|", "list-ul", "list-ol", "hr", "|", "link", "reference-link", "image", "code", "preformatted-text", "code-block", "table", "datetime", "emoji", "html-entities", "pagebreak", "|", "goto-line", "watch", "preview", "fullscreen", "clear", "search", "|", "help", "info"]
        },

        // Editor.md theme, default or dark, change at v1.5.0
        // You can also custom css class .editormd-preview-theme-xxxx
        theme        : (localStorage.theme) ? localStorage.theme : "default",
        
        // Preview container theme, added v1.5.0
        // You can also custom css class .editormd-preview-theme-xxxx
        previewTheme : (localStorage.previewTheme) ? localStorage.previewTheme : "default", 
        
        // Added @v1.5.0 & after version is CodeMirror (editor area) theme
        editorTheme  : (localStorage.editorTheme) ? localStorage.editorTheme : "default", 
        path         : './assets/editormd/lib/'
    });
    
    themeSelect("editormd-theme-select", editormd.themes, "theme", function($this, theme) {
        mainEditor.setTheme(theme);
    });
    
    themeSelect("editor-area-theme-select", editormd.editorThemes, "editorTheme", function($this, theme) {
        mainEditor.setCodeMirrorTheme(theme); 
        // or mainEditor.setEditorTheme(theme);
    });
    
    themeSelect("preview-area-theme-select", editormd.previewThemes, "previewTheme", function($this, theme) {
        mainEditor.setPreviewTheme(theme);
    });          
});