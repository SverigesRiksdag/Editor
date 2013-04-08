

function saveSelection(w, savedRange) {
    if(w.getSelection)//non IE Browsers
    {
        savedRange = w.getSelection().getRangeAt(0);
    }
    else if(w.contentDocument.selection)//IE
    { 
        savedRange = w.contentDocument.selection.createRange();  
    } 
}


function restoreSelection(f, savedRange) {
     var w = f.contentWindow;
     var d = f.contentDocument;

    if (savedRange != null) {
        if (w.getSelection)//non IE and there is already a selection
        {
            var s = w.getSelection();
            if (s.rangeCount > 0) 
                s.removeAllRanges();
            s.addRange(savedRange);
        }
        else 
            if (d.createRange)//non IE and no selection
            {
                w.getSelection().addRange(savedRange);
            }
            else 
                if (d.selection)//IE
                {
                    savedRange.select();
                }
    }
}


function addTypeAhead(editor) {

     var doc = editor.composer.iframe.contentDocument;
     var win = editor.composer.iframe.contentWindow;
     var frame = editor.composer.iframe;
     editor.savedRange = null;

     $(frame.contentDocument).bind('keyup', 'ctrl+l', function(e){

          frame.insertPerson = function() {
               $(this).contents().find("body").focus();
               restoreSelection(this, editor.savedRange);
               if(frame.inp.val() != "") {
                    editor.composer.commands.exec("insertHTML", frame.inp.val());
               }
               frame.inp.remove();
               frame.inp.typeahead("destroy");
          }
          
          saveSelection(frame.contentWindow, editor.savedRange); // Dokumentera detta
          
          frame.inp = $("<input style='display:block; '/>"); //Create the field for input of person namne
          $(frame).after(frame.inp);          
          frame.inp.typeahead({
            name: 'personer',
            local: values
          });
          
          frame.inp.focus(); // Set focus in the inputfield

          var val = "";

          frame.inp.on("typeahead:closed", function(e) {
               frame.insertPerson();
          });
     });
}