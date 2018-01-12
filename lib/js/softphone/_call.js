// Call page
define(['jquery', 'common', 'stringres', 'global'], function($, common, stringres, global)
{
var calltype = '';
var callnumber = '';
var showcallfwd = false; // dislplay call forward option in menu: callforward csak bejovo hivas ring-nel
var showignore = false;
var hanguponchat = false; // bejovo hivasnal call ablakbol chat-et valaszt es ringing-ben van akkor hangup call
var isvideo = false;  // is video call


function onCreate (event) // called only once - bind events here
{
    try{
    common.PutToDebugLog(4, "EVENT, _call: onCreate");
    
//    $('#testml').on('click', function(event)
//    {
//        common.PrintEndpoints();
//    });
    $('#call_menu_ul').on('click', 'li', function(event)
    {
        MenuItemSelected($(this).attr('id'));
    });
    $("#btn_call_menu").on("click", function()
    {
        CreateOptionsMenu('#call_menu_ul');
    });
    $("#btn_call_menu").attr("title", stringres.get("hint_menu"));
    
    $("#btn_hangup").on("click", function()
    {
        common.PutToDebugLog(4, 'EVENT, _call Hangup onclick');
        HangupCall();
    });
    
    $("#btn_accept").on("click", function()
    {
        common.PutToDebugLog(4, 'EVENT, _call AcceptCall onclick');
        AcceptCall(true);
    });
    
    $("#btn_reject").on("click", function()
    {
        common.PutToDebugLog(4, 'EVENT, _call RejectCall onclick');
        RejectCall(true);
    });
    
    $("#btn_accept_end").on("click", function()
    {
        common.PutToDebugLog(4, 'EVENT, _call AcceptEnd onclick');
        AcceptEnd(true);
    });
    
    $("#btn_reject_ml").on("click", function()
    {
        common.PutToDebugLog(4, 'EVENT, _call RejectCallMultiline onclick');
        RejectCallMultiline(true);
    });
    
    $("#btn_accept_hold").on("click", function()
    {
        common.PutToDebugLog(4, 'EVENT, _call AcceptHold onclick');
        AcceptHold(true);
    });
    
    $("#btn_hangup").attr("title", stringres.get("hint_hangup"));
    $("#btn_accept").attr("title", stringres.get("hint_accept"));
    $("#btn_reject").attr("title", stringres.get("hint_reject"));
    $("#calledcaller").attr("title", stringres.get("hint_called"));
    $("#status_call").attr("title", stringres.get("hint_callstatus"));
    $("#call_duration").attr("title", stringres.get("hint_callduration"));
    
    $("#btn_accept_end").attr("title", stringres.get("hint_accept_end"));
    $("#btn_reject_ml").attr("title", stringres.get("hint_reject_new"));
    $("#btn_accept_hold").attr("title", stringres.get("hint_accept_hold"));
    
    $("#btn_audiodevice").on("click", function()
    {
        common.PutToDebugLog(4, 'EVENT, _call webphone_audiodevice onclick');
        //webphone_api.audiodevice();
        common.AudioDevicePopup();
    });
    
    
  //  var idx = 0;
    var timerid;
    $( window ).resize(function() // window resize handling
    {
        if ($.mobile.activePage.attr('id') === 'page_call')
        {
            if ( !common.isNull(timerid) ) { clearTimeout(timerid); }
            timerid = setTimeout(function ()
            {
                AddCallFunctions(false);
                MeasureCall();
//                idx++;
//                common.PutToDebugLog(2, 'idx = ' + idx);
            }, 100);
        }
    });
    
    $("#numpad_btn_dp_1").on("click", function() { SendDtmf('1'); });
    $("#numpad_btn_dp_2").on("click", function() { SendDtmf('2'); });
    $("#numpad_btn_dp_3").on("click", function() { SendDtmf('3'); });
    $("#numpad_btn_dp_4").on("click", function() { SendDtmf('4'); });
    $("#numpad_btn_dp_5").on("click", function() { SendDtmf('5'); });
    $("#numpad_btn_dp_6").on("click", function() { SendDtmf('6'); });
    $("#numpad_btn_dp_7").on("click", function() { SendDtmf('7'); });
    $("#numpad_btn_dp_8").on("click", function() { SendDtmf('8'); });
    $("#numpad_btn_dp_9").on("click", function() { SendDtmf('9'); });
    $("#numpad_btn_dp_0").on("click", function() { SendDtmf('0'); });
    $("#numpad_btn_dp_ast").on("click", function() { SendDtmf('*'); });
    $("#numpad_btn_dp_diez").on("click", function() { SendDtmf('#'); });
    
    /*
    $( "#volumein" ).slider({
        create: function( event, ui ) { alert('slidecreate1'); }
    });
    
    $( "#volumein" ).on( "slidecreate", function( event, ui )
    {
        var invalue = common.GetParameter('volumein');
        
        if (common.isNull(invalue) || invalue.length < 1 || !common.IsNumber(invalue))
        {
            invalue = '50';
        }
        
        this.value = invalue;
    });*/
        
    } catch(err) { common.PutToDebugLogException(2, "_call: onCreate", err); }
}

function onStart(event)
{
    try{
    common.PutToDebugLog(4, "EVENT, _call: onStart");
    global.isCallStarted = true;
    
    global.hangupPressedCount = 0;
    
    MeasureCall(); // resolve window height size change
    
    if (!common.isNull(document.getElementById("app_name_call"))
        && common.GetParameter('devicetype') !== common.DEVICE_WIN_SOFTPHONE())
    {
        document.getElementById("app_name_call").innerHTML = common.GetBrandName();
    }
    $(".separator_line_thick").css( 'background-color', common.HoverCalc(common.getBgColor('#call_header'), -30) );
    
    $('#btn_hangup_img').attr('src', '' + common.GetElementSource() + 'images/btn_hangup_txt.png');
    
    if (!common.isNull(document.getElementById('btn_audiodevice')))
    {
        document.getElementById('btn_audiodevice').innerHTML = stringres.get('btn_audio_device');
    }
    
    if (common.GetParameterBool('displayvolumecontrols', false) === true)
    {
        $('#volumecontrols').show();
    }

    if (common.GetParameterBool('displayaudiodevice', false) === true)
    {
        $('#audiodevice_container').show();
    }
    
    
// set volume controls values
    var invalue = common.GetParameter('volumein');
    if (common.isNull(invalue) || invalue.length < 1 || !common.IsNumber(invalue))
    {
        invalue = '50';
    }
    $("#volumein").val(invalue);
    $("#volumein").slider('refresh');
    
    var outvalue = common.GetParameter('volumeout');
    if (common.isNull(outvalue) || outvalue.length < 1 || !common.IsNumber(outvalue))
    {
        outvalue = '50';
    }
    $("#volumeout").val(outvalue);
    $("#volumeout").slider('refresh');
    
// handle volume control on change
    $( "#volumein" ).on( "slidestop", function( event, ui )
    {
        var setval = this.value;
        
        if (common.isNull(setval) || setval.length < 1) { return; }
        
        setval = common.Trim(setval);

        common.SaveParameter('volumein', setval);
        common.PutToDebugLog(5, 'EVENT, volumein slidestop: ' + this.value);
        
        //  -0 for the recording (microphone) audio device
        //  -1 for the playback (speaker) audio device
        //  -2 for the ringback (speaker) audio device
        webphone_api.setvolume(0, setval);
    });
    
    $( "#volumeout" ).on( "slidestop", function( event, ui )
    {
        var setval = this.value;
        
        if (common.isNull(setval) || setval.length < 1) { return; }
        
        setval = common.Trim(setval);

        common.SaveParameter('volumeout', setval);
        common.PutToDebugLog(5, 'EVENT, volumeout slidestop: ' + this.value);
        
        webphone_api.setvolume(1, setval);
    });
    
    calltype  = common.GetIntentParam(global.intentcall, 'calltype');
    var isvideostr  = common.GetIntentParam(global.intentcall, 'isvideo');
    if (isvideostr === 'true') { isvideo = true; }
    
/*
if (global.isdebugversionakos)
{
    calltype = 'outgoing';
}*/

//##AKOS
//calltype = 'outgoing';

    global.callName = ''; // reset global.callName
    
    callnumber = common.GetIntentParam(global.intentcall, 'number');
    global.callName = common.GetIntentParam(global.intentcall, 'name');
    
    if (common.isNull(global.callName) || global.callName.length < 1)
    {
        global.callName = common.GetContactNameFromNumber(callnumber);
    }
    
    var telsearchurl = common.GetParameter2('telsearchurl');
    if (common.isNull(telsearchurl) || telsearchurl.length < 3) { telsearchurl = webphone_api.parameters['telsearchurl']; }
    if (!common.isNull(telsearchurl) && telsearchurl.length > 3 && (global.callName.length < 1 || global.callName === callnumber))
    {
        webphone_api.gettelsearchname(callnumber, function (recname)
        {
            if (common.isNull(recname) || recname.length < 2 || recname.length > 60) { return; }
            global.callName = recname;
            peerdetails = global.callName + '&nbsp;(' + callnumber + ')&nbsp;';
            $('#calledcaller').html(peerdetails);
            $('#page_call_peer_details').html(peerdetails);
        });
    }
    
// don't display username and name, if both are the same
    var peerdetails = '';
    if (global.callName !== callnumber)
    {
        peerdetails = global.callName + '&nbsp;(' + callnumber + ')&nbsp;';
        $('#calledcaller').html(peerdetails);
    }else
    {
        peerdetails = callnumber;
        $('#calledcaller').html(peerdetails);
    }
    
    $('#page_call_peer_details').html(peerdetails);
    
    if (calltype === "incoming")
    {
        webphone_api.GetIncomingDisplay(function (disp)
        {
            if (!common.isNull(disp) && disp.length > 0 && peerdetails.indexOf(disp) < 0)
            {
                peerdetails = disp + '<br>' + peerdetails;
            }
            $('#page_call_peer_details').html(peerdetails);
        });
    }else
    {
        $('#page_call_peer_details').html(peerdetails);
    }
    
    // handle hangup / acceptreject layouts (icoming / outgoing call)

    if (calltype === "outgoing")
    {
        AddCallFunctions(false);
        
        $('#acceptreject_layout').hide();
        $('#hangup_layout').show();
        $('#callfunctions_layout').show();
        
        //if (!global.isdebugversionakos)
        //{
            //webphone_api.call(-1, callnumber);
            
            setTimeout(function ()
            {
                var ratinguri = common.GetParameter('ratingrequest');
                if ( !common.isNull(ratinguri) && ratinguri.length > 2 && !common.isNull(callnumber) && callnumber.length > 0
                        && (common.isNull(global.rating) || (global.rating).length < 1) ) // means rating is not received from signaling
                {
                    webphone_api.needratingrequest(function (val) // API_NeedRatingRequest
                    {
                        if (val === true)
                        {
                            common.UriParser(ratinguri, '', callnumber, '', '', 'getrating');
                        }
                    });
                }
            }, 4000);
        //}
    }

    if (calltype === "incoming")
    {
        if (common.GetParameter2('autoaccept') === 'true')
        {
            $('#hangup_layout').show();
            $('#callfunctions_layout').show();
            $('#acceptreject_layout').hide();
        }else
        {
            // normal call
            AddCallFunctions(true);
            showignore = true;
            hanguponchat = true;
            $('#hangup_layout').hide();
            $('#callfunctions_layout').hide();
            $('#acceptreject_layout').show();
        }
    }
    
    if (isvideo === true)
    {
        $('#contact_details').hide();
        $('#video_container').show();
        common.PutToDebugLog(2, 'EVENT, call onstart video container displayed');
    }
    
    MeasureCall();
    setTimeout(function () { MeasureCall(); }, 200);
    
    } catch(err) { common.PutToDebugLogException(2, "_call: onStart", err); }
}

function OnNewIncomingCall()
{
    try{
    var ep = common.GetEndpoint(global.aline, '', '', false);
    if (common.isNull(ep) || ep.length < 5)
    {
        common.PutToDebugLog(2, 'ERROR, _call OnNewIncomingCall: ep is NULL')
        return;
    }
    
    var innr = ep[common.EP_DESTNR];
    $('#mline_layout').show();
    
    if ($('#hangup_layout').is(':visible'))
    {
        $('#hangup_layout').hide();
    }
    
    AddLineUI();
    
    common.RefreshInfo();
    
    setTimeout(function () { MeasureCall(); }, 200);
    
    } catch(err) { common.PutToDebugLogException(2, "_call: OnNewIncomingCall", err); }
}

function RejectCallMultiline(callapi)
{
    try{
    showignore = false;
    hanguponchat = false;
    $('#mline_layout').hide();
    $('#callfunctions_layout').hide();
    $('#hangup_layout').show();
    setTimeout(function () { MeasureCall(); }, 200);

    global.acceptReject = true;
//    global.hangupPressedCount = 1;
    
//find last incoming call to reject; because maybe user changed line, but even then reject the incoming line
    if (callapi)
    {
        var linetoreject = global.aline; // 1=outgoing, 2=incoming
        var setuptime = 0;

        for (var i = 0; i < global.ep.length; i++)
        {
            if (isNull(global.ep[i]) || global.ep[i].length < 5) { continue; }
            if (global.ep[i][common.EP_INCOMING] !== '2') { continue; }
            
            var stime = common.StrToInt(global.ep[i][common.EP_SETUPTIME]);
            if (!common.isNull(stime) && common.IsNumber(stime) && stime > setuptime)
            {
                setuptime = stime;
                linetoreject = global.ep[i][common.EP_LINE];
            }
        }
        
        plhandler_public.Reject(linetoreject);

    // update lines (remove line and set last active line)
        for (var i = 0; i < global.ep.length; i++)
        {
            if (isNull(global.ep[i]) || global.ep[i].length < 5) { continue; }

            var lntmp = global.ep[i][common.EP_LINE];
            if (lntmp == global.aline)
            {
                global.ep[i][common.EP_FLAGDEL] = 'true';
                break;
            }
        }
        
    // find last active line
        for (var i = global.ep.length - 1; i >= 0; i--)
        {
            if (isNull(global.ep[i]) || global.ep[i].length < 5) { continue; }

            if (global.ep[i][common.EP_FLAGDEL] == 'false')
            {
                // found one active line, set it
                webphone_api.setline(common.StrToInt(global.ep[i][common.EP_LINE]));
                break;
            }
        }
        
        UpdateLineUI();
        setTimeout(function ()
        {
            common.RefreshInfo();
        }, 400);
    }
    isvideo = false;
    } catch(err) { common.PutToDebugLogException(2, "_call: RejectCallMultiline", err); }
}

function AcceptHold(callapi)
{
    try{
    global.acceptReject = true;
    
    AddCallFunctions(false);
    showignore = false;
    hanguponchat = false;
    
    $('#mline_layout').hide();
    $('#hangup_layout').show();
    $('#callfunctions_layout').show();
    
    setTimeout(function () { MeasureCall(); }, 200);

    if (callapi)
    {
        // find previous active line to put that call on hold
/*        var prevline = -10;
        if (!common.isNull(global.ep))
        {
            for (var i = 0; i < global.ep.length; i++)
            {
                var eptmp = global.ep[i];
                if (common.isNull(eptmp) || eptmp.length < 1) { continue; }
                
                if (eptmp[common.EP_FLAGDEL] === 'true') { continue; }
                
                if (!common.isNull(eptmp[common.EP_LINE]) && common.IsNumber(eptmp[common.EP_LINE]) === true)
                {
                    prevline = common.StrToInt(eptmp[common.EP_LINE]);
                    break;
                }
            }
        }
        if (prevline > 0)
        {
            var linetmp = global.aline;
            webphone_api.setline(prevline);
            webphone_api.hold(true);
            webphone_api.setline(linetmp);
        }*/
        setTimeout(function ()
        {
            webphone_api.accept(global.aline);
        }, 250);
    }
    } catch(err) { common.PutToDebugLogException(2, "_call: AcceptHold", err); }
}

function AcceptEnd(callapi)
{
    try{
    global.acceptReject = true;
    
    AddCallFunctions(false);
    showignore = false;
    hanguponchat = false;
    
    $('#mline_layout').hide();
    $('#hangup_layout').show();
    $('#callfunctions_layout').show();
    
    setTimeout(function () { MeasureCall(); }, 200);

    if (callapi)
    {
        // find previous active line to end that call
        var prevline = -10;
        if (!common.isNull(global.ep))
        {
            for (var i = 0; i < global.ep.length; i++)
            {
                var eptmp = global.ep[i];
                if (common.isNull(eptmp) || eptmp.length < 1) { continue; }
                
                if (eptmp[common.EP_FLAGDEL] === 'true') { continue; }
                
                if (!common.isNull(eptmp[common.EP_LINE]) && common.IsNumber(eptmp[common.EP_LINE]) === true)
                {
                    prevline = common.StrToInt(eptmp[common.EP_LINE]);
                    break;
                }
            }
        }
        
        if (prevline > 0)
        {

            var linetmp = global.aline;
            webphone_api.setline(prevline);
            webphone_api.hangup();
        }
        setTimeout(function ()
        {
            webphone_api.setline(linetmp);
            webphone_api.accept(global.aline);
            UpdateLineUI(global.aline);
        }, 250);
    }
    } catch(err) { common.PutToDebugLogException(2, "_call: AcceptEnd", err); }
}

function MeasureCall() // resolve window height size change
{
    try{
    //var pgh = common.GetDeviceHeight() - 1; $('#page_call').css('min-height', pgh + 'px'); // must be set when softphone is skin in div
    $('#page_call').css('min-height', 'auto'); // must be set when softphone is skin in div

    var volumevisible = false;
    var audiodevicevisible = false;
    if ($('#volumecontrols').is(':visible')) { volumevisible = true; }
    if ($('#audiodevice_container').is(':visible')) { audiodevicevisible = true; }

    $("#page_call_content").height(common.GetDeviceHeight() - $("#call_header").height() -$('.separator_line_thick').height());

    var pageHeight = common.GetDeviceHeight() - $("#call_header").height();
    $('#page_call_content').height(pageHeight - 3);
    
    
    var numpadHeight = pageHeight - $("#hangup_layout").height() - $("#callfunctions_layout").height() - $(".separator_color_bg").height() - 12;
    if ($('#mlcontainer').is(':visible')) { numpadHeight = numpadHeight - $('#mlcontainer').height() - 2; }
    
    var rowHeight = Math.floor(numpadHeight / 5);
    $("#numpad_btn_grid .ui-btn").height(rowHeight);

    if (common.GetBrowser() === 'MSIE')
    {
        rowHeight = rowHeight - 6;
    }    
    $("#numpad_number_container").height(rowHeight);
    $("#numpad_number_container").css("line-height", rowHeight + "px");
    
    if (calltype === "outgoing")
    {
        pageHeight = pageHeight - $("#hangup_layout").height() - $("#callfunctions_layout").height() - $(".separator_color_bg").height() - 1;
        
        if (volumevisible) { pageHeight = pageHeight - $("#volumecontrols").height(); }
        if (audiodevicevisible) { pageHeight = pageHeight - $("#audiodevice_container").height(); }
        pageHeight = pageHeight - $("#mlcontainer").height() - $(".separator_line_thick").height();
        pageHeight = Math.floor(pageHeight);

        $("#contact_image").height(  pageHeight );
        //$("#contact_image").css("line-height", pageHeight + "px");
        var mTop = (pageHeight - $("#contact_image_img").height() - $("#page_call_additional_info").height()) / 2;
        $("#contact_image_img").css("margin-top", mTop + "px");
    }

    if (calltype === "incoming")
    {
        if (document.getElementById('acceptreject_layout').style.display === 'block')
        {
            pageHeight = pageHeight - $("#acceptreject_layout").height() - 3;
            if (volumevisible) { pageHeight = pageHeight - $("#volumecontrols").height(); }
            if (audiodevicevisible) { pageHeight = pageHeight - $("#audiodevice_container").height(); }
            pageHeight = pageHeight - $("#mlcontainer").height() - $(".separator_line_thick").height();
            pageHeight = Math.floor(pageHeight);
        }else
        {
            pageHeight = pageHeight - $("#hangup_layout").height() - $("#callfunctions_layout").height() - $(".separator_color_bg").height() - 1;
            if (volumevisible) { pageHeight = pageHeight - $("#volumecontrols").height(); }
            if (audiodevicevisible) { pageHeight = pageHeight - $("#audiodevice_container").height(); }
            pageHeight = pageHeight - $("#mlcontainer").height() - $(".separator_line_thick").height();
            pageHeight = Math.floor(pageHeight);
        }

        $("#contact_image").height(  pageHeight );
        //$("#contact_image").css("line-height", pageHeight + "px");
        var mTop = (pageHeight - $("#contact_image_img").height() - $("#page_call_additional_info").height()) / 2;
        $("#contact_image_img").css("margin-top", mTop + "px");
    }
    } catch(err) { common.PutToDebugLogException(2, "_call: MeasureCall", err); }
}

function HangupCall()
{
    try{
        // reset mute, hold, speaker buttons state
    $('#mute_status').removeClass("callfunc_status_on");
    $('#hold_status').removeClass("callfunc_status_on");
    $('#speaker_status').removeClass("callfunc_status_on");

    if (global.acallcount < 2)
    {
        global.hangupPressedCount++;
    }
    
    common.PutToDebugLog(4, 'EVENT, _call HangupCall');

    if (global.hangupPressedCount < 2)
    {
        if (common.IsMultiline() !== 1)
        {
            $('#callfunctions_layout').hide();
            $('#btn_hangup_img').attr('src', '' + common.GetElementSource() + 'images/btn_close_txt.png');
        }
        webphone_api.hangup();
        
        UpdateLineUI();
        setTimeout(function ()
        {
            common.RefreshInfo();
        }, 400);
    }
    else if (global.hangupPressedCount > 1)
    {
        webphone_api.hangup();
        $.mobile.back();

        global.hangupPressedCount = 0;
    }
    isvideo = false;

    } catch(err) { common.PutToDebugLogException(2, "_call: HangupCall", err); }
}

function AcceptCall(callapi)
{
    try{
    global.acceptReject = true;
    
    AddCallFunctions(false);
    showignore = false;
    hanguponchat = false;
    
    $('#acceptreject_layout').hide();
    $('#hangup_layout').show();
    $('#callfunctions_layout').show();
    
    setTimeout(function () { MeasureCall(); }, 200);

//    CallfunctionUsage(); TODO: implement
    
    if (callapi)
    {
        webphone_api.accept(-2);
    }
    } catch(err) { common.PutToDebugLogException(2, "_call: AcceptCall", err); }
}

function RejectCall(callapi)
{
    try{
    showignore = false;
    hanguponchat = false;
    $('#acceptreject_layout').hide();
    $('#callfunctions_layout').hide();
    $('#hangup_layout').show();
    setTimeout(function () { MeasureCall(); }, 200);

    global.acceptReject = true;
    global.hangupPressedCount = 1;
    
    if (callapi)
    {
        webphone_api.reject(-2);
    }
    isvideo = false;

    } catch(err) { common.PutToDebugLogException(2, "_call: RejectCall", err); }
}

function SendDtmf(numChar)
{
    try{
    common.PutToDebugLog(5,"EVENT, _call SendDtmf: " + numChar);
    	
    webphone_api.dtmf(numChar, -1);

    var currNumVal = $('#numpad_number').html();
    if (common.isNull(currNumVal)) { currNumVal = ''; }
    
    if (currNumVal.length > 18) { currNumVal = currNumVal.substring(10, currNumVal.length) + ' '; }
    
    $('#numpad_number').html(currNumVal + numChar);
    
    } catch(err) { common.PutToDebugLogException(2, "_call: SendDtmf", err); }
}

function CloseCall()
{
    try{
    common.PutToDebugLog(3, 'EVENT, _call CloseCall');
    $.mobile.back();
    } catch(err) { common.PutToDebugLogException(2, "_call: CloseCall", err); }
}

// show close button if the caller hangs up before it is accepted or rejected
function OnCallerHangup() //TODO:
{
    try{/*
    hangupLayout.setVisibility(View.VISIBLE);
            incomingLayout.setVisibility(View.GONE);
            callFunctionsLayout.setVisibility(View.INVISIBLE);

            incomingVideoLayout.setVisibility(View.GONE);

            if (isVideoOn) VideoOnPause(); // stop video
*/
    global.hangupPressedCount = 1;

    } catch(err) { common.PutToDebugLogException(2, "_call: OnCallerHangup", err); }
}

function AddLineUI() // returns active line number
{
    try{
    if (common.IsSDK() === true) { return; }
    var mlcont = document.getElementById('mlcontainer');
    if (common.isNull(mlcont)) { return; }
    if (mlcont.style.display === 'none') { mlcont.style.display = 'block'; }
    
    var ml_btns = document.getElementById('ml_buttons');
    if (common.isNull(ml_btns)) { return; }
        
    var template = '' +
        '<button class="ui-btn line_btn noshadow" data-theme="b" id="btn_line_[LINENR]">' +
            '<span class="line_text">' + stringres.get('line_title') + ' [LINENR]</span>' +
            '<span class="line_status [ISACTIVE]" id="line_[LINENR]_status" >&nbsp;</span>' +
        '</button>';
    
    var count = $("#ml_buttons .line_btn").length;
    if (common.isNull(count) || common.IsNumber(count) === false) { count = 0; }
    count = common.StrToInt(count);

// when we first add a line, we have to add 2 lines
    if (count === 0)
    {
        var nr = count + 1;
        count++;
        var btn = common.ReplaceAll(template, '[LINENR]', nr);
        btn = btn.replace('[ISACTIVE]', '');
        
        ml_btns.innerHTML += btn;
    }
    
    var nr = count + 1;
    
// reset active states
    for (var i = 1; i <= nr; i++)
    {
        if ( $('#line_' + i + '_status').hasClass('line_status_on') )
        {
            $('#line_' + i + '_status').removeClass('line_status_on');
        }
    }
    
// check if we have a fee line and don't have to add new line buttons
    global.aline = common.GetFreeLine();
    var newbtn = document.getElementById('btn_line_' + global.aline.toString());
    if (!common.isNull(newbtn)) // if line button exists
    {
        $('#line_' + global.aline.toString() + '_status').addClass('line_status_on');
    }else
    {
        var btn = common.ReplaceAll(template, '[LINENR]', global.aline);
        btn = btn.replace('[ISACTIVE]', 'line_status_on');

        ml_btns.innerHTML += btn;
    }
    
// reset onclcik listeners for all buttons
    for (var i = 1; i <= nr; i++)
    {
        $('#btn_line_' + i).off('click');
        $('#btn_line_' + i).on('click', function (e)
        {
            LineCliked($(this).attr('id'));
        });
    }
    
    MeasureCall();
    return global.aline;
    
    } catch(err) { common.PutToDebugLogException(2, "_call: AddLineUI", err); }
    return -1;
}

function UpdateLineUI(line) // removes (expired/dead) EP_FLAGDEL == true  lines from UI
{
    try{
    if (common.IsSDK() === true) { return; }
    var mlcont = document.getElementById('mlcontainer');
    if (common.isNull(mlcont)) { return; }
    if (mlcont.style.display === 'none') { mlcont.style.display = 'block'; }
    
    var ml_btns = document.getElementById('ml_buttons');
    if (common.isNull(ml_btns)) { return; }
        
    var template = '' +
        '<button class="ui-btn line_btn noshadow" data-theme="b" id="btn_line_[LINENR]">' +
            '<span class="line_text">' + stringres.get('line_title') + ' [LINENR]</span>' +
            '<span class="line_status [ISACTIVE]" id="line_[LINENR]_status" >&nbsp;</span>' +
        '</button>';
    
    ml_btns.innerHTML = '';
    var anyadded = false;
    for (var i = 0; i < global.ep.length; i++)
    {
        if (common.isNull(global.ep[i]) || global.ep[i][common.EP_FLAGDEL] == 'true') { continue; }
        var caldisctime = global.ep[i][common.EP_DISCONNECTTIME].toString();
        if (caldisctime.length > 3) { continue; } // means call was already hanged up
        
        var ln = common.StrToInt(global.ep[i][common.EP_LINE]);
        
        var btn = common.ReplaceAll(template, '[LINENR]', ln);
        if (global.aline === ln)
        {
            btn = btn.replace('[ISACTIVE]', '');
        }else
        {
            btn = btn.replace('[ISACTIVE]', 'line_status_on');
        }
        
        ml_btns.innerHTML += btn;
        anyadded = true;
        
        if (!common.isNull(line) && common.IsNumber(line))
        {
            $('#line_' + line + '_status').addClass('line_status_on');
        }
        
        $('#btn_line_' + ln).off('click');
        $('#btn_line_' + ln).on('click', function (e)
        {
            LineCliked($(this).attr('id'));
        });
    }
    if (anyadded === false)
    {
        mlcont.style.display = 'none';
    }

    MeasureCall();
    
    } catch(err) { common.PutToDebugLogException(2, "_call: UpdateLineUI", err); }
}

function LineCliked(id, callsetline)
{
    try{
    if (common.IsSDK() === true) { return; }
    if (common.isNull(id) || id.indexOf('btn_line_') !== 0)
    {
        common.PutToDebugLog(2, 'ERROR, _call: LineCliked invalid id: ' + id);
        return;
    }
    id = id.replace('btn_line_', '');
    var line = common.StrToInt(id);
    
    var count = $("#ml_buttons .line_btn").length;
    if (common.isNull(count) || common.IsNumber(count) === false) { count = 0; }
    count = common.StrToInt(count);

// reset active states
    for (var i = 1; i <= count; i++)
    {
        if ( $('#line_' + i + '_status').hasClass('line_status_on') )
        {
            $('#line_' + i + '_status').removeClass('line_status_on');
        }
    }
    $('#line_' + line + '_status').addClass('line_status_on');
    
    if (common.isNull(callsetline) || callsetline === true)
    {
        webphone_api.setline(line);
        common.PutToDebugLog(1, 'EVENT, Line ' + line.toString() + ' selected');
    }
    } catch(err) { common.PutToDebugLogException(2, "_call: LineCliked", err); }
}

// change active line, add line buttons and display otion for call
function NewMultilineCall(phoneNr)
{
    try{
    common.PutToDebugLog(2, 'EVENT, NewMultilineCall');
    
    if (global.isdebugversionakos)
    {
        common.GetContacts(function () {});
    }
    
    var popupWidth = common.GetDeviceWidth();
    if ( !common.isNull(popupWidth) && common.IsNumber(popupWidth) && popupWidth > 100 )
    {
        popupWidth = Math.floor(popupWidth / 1.2);
    }else
    {
        popupWidth = 220;
    }
    var btnimage = 'btn_add_contact_txt.png';
    
    var template = '' +
'<div id="mlcall_popup" data-role="popup" class="ui-content messagePopup" data-overlay-theme="a" data-theme="a" style="max-width:' + popupWidth + 'px;">' +

    '<div data-role="header" data-theme="b">' +
        '<a href="javascript:;" data-role="button" data-icon="delete" data-iconpos="notext" class="ui-btn-right closePopup">Close</a>' +
        '<h1 class="adialog_title">' + stringres.get('menu_multilinecall') + '</h1>' +
    '</div>' +
    '<div role="main" class="ui-content adialog_content adialog_btn_nexttoinput">' +
        '<span>' + stringres.get('phone_nr') + '</span>' +
        '<div style="clear: both;"><!--//--></div>' +
        '<input type="text" id="mlcall_input" name="setting_item" data-theme="a"/>' +
        '<button id="btn_pickct" class="btn_nexttoinput ui-btn ui-btn-corner-all ui-btn-b noshadow"><img src="' + common.GetElementSource() + 'images/' + btnimage + '"></button>' +
    '</div>' +
    '<div data-role="footer" data-theme="b" class="adialog_footer">' +
        '<a href="javascript:;" id="adialog_positive" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back" data-transition="flow">' + stringres.get('btn_ok') + '</a>' +
        '<a href="javascript:;" id="adialog_negative" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back">' + stringres.get('btn_cancel') + '</a>' +
    '</div>' +
'</div>';

    var popupafterclose = function () {};

    $.mobile.activePage.append(template).trigger("create");
    //$.mobile.activePage.append(template).trigger("pagecreate");

    $.mobile.activePage.find(".closePopup").bind("tap", function (e)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");
    });

    $.mobile.activePage.find(".messagePopup").popup().popup("open").bind(
    {
        popupafterclose: function ()
        {
            $(this).unbind("popupafterclose").remove();
            $('#adialog_positive').off('click');
            $('#adialog_negative').off('click');
            $('#btn_pickct').off('click');
            popupafterclose();
        }
    });
    
// listen for enter onclick, and click OK button
/* no need for this, because it reloads the page
    $( "#mlcall_popup" ).keypress(function( event )
    {
        if ( event.which === 13 )
        {
            event.preventDefault();
            $("#adialog_positive").click();
        }else
        {
            return;
        }
    });*/

    var textBox = document.getElementById('mlcall_input');
    if (!common.isNull(phoneNr) && phoneNr.length > 0) { textBox.value = phoneNr; }
    if (!common.isNull(textBox)) { textBox.focus(); } // setting cursor to text input

    $('#adialog_positive').on('click', function (event)
    {
        common.PutToDebugLog(5,'EVENT, call NewMultilineCall ok onclick');

        var textboxval = common.Trim(textBox.value);
        
        if (!common.isNull(textboxval) && textboxval.length > 0)
        {
            //webphone_api.hold(true); // hold previous call
            var aline = AddLineUI(); // get new active line
            webphone_api.setline(aline);
            webphone_api.call(textboxval);
            
            common.RefreshInfo();
        }else
        {
            common.ShowToast(stringres.get('err_msg_4'));
            $.mobile.back();
        }
    });

    $('#adialog_negative').on('click', function (event)
    {
        ;
    });

    $('#btn_pickct').on('click', function (event)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");

        $( '#mlcall_popup' ).on( 'popupafterclose', function( event )
        {
            $( '#mlcall_popup' ).off( 'popupafterclose' );

            common.PickContact(NewMultilineCall);
        });
    });
    } catch(err) { common.PutToDebugLogException(2, "_call: NewMultilineCall", err); }
}

function AddCallFunctions(addcallfwd) // addcallfwd: true/false   callforward csak bejovo hivas ring-nel
{
    try{
    if (common.IsSDK() === true) { return; }
    if (common.GetParameterInt('featureset', 10) < 0)
    {
        $('#callfunctions_layout').hide();
        MeasureCall();
        return;
    }
    
    showcallfwd = addcallfwd;

    var content = '';
    $('#callfunctions_layout').html('');

    var availableFunc = common.GetAvailableCallfunctions();
    if ( common.isNull(availableFunc) || availableFunc.length < 3)
    {
        common.PutToDebugLog(2, 'ERROR, _call: AddCallFunctions no available callfunctions (1)');
        return;
    }

    var callfunc = document.getElementById("callfunctions_layout");
    if ( common.isNull(callfunc) )
    {
        common.PutToDebugLog(2, 'ERROR, _call: AddCallFunctions no available callfunctions (2)');
        return;
    }
    
    var usageStr = common.GetParameter('callfunctionsbtnusage');
    if (common.isNull(usageStr) || usageStr.length <= 0)
    {
        usageStr = '10,0,5,9,8,10,12,1,3,-2';
        common.SaveParameter('callfunctionsbtnusage', usageStr); // DoVersioning
    }
    // calculate video priority
    //usageStr = usageStr.substring(0, usageStr.lastIndexOf(",") + 1) + CommonGUI.GetObj().VideoPriority(this);

    var tmp = '';
    var usage = usageStr.split(',');
    var usageNames = ["callforward","conference", "transfer", "mute", "hold", "speaker", "numpad", "bluetooth", "chat", "video"];
    
    if (addcallfwd !== true)
    {
        usage.splice(0, 1);
        usageNames.splice(0, 1);
    }
    
    for (var i = 0; i < usage.length; i++)
    {
        for (var j = i + 1; j < usage.length; j++)
        {
            var usi = 0;
            var usj = 0;

            try{
            usi = common.StrToInt(usage[i].trim());
            usj = common.StrToInt(usage[j].trim());
            }catch(ein){  common.PutToDebugLogException(2,"_call AddCallFunctions parseint", ein); }

            //if( usage[i].compareTo(usage[j]) < 0 )
            if( usi < usj )
            {
                tmp = usage[i];
                usage[i] = usage[j];
                usage[j] = tmp;

                tmp = usageNames[i];
                usageNames[i] = usageNames[j];
                usageNames[j] = tmp;
            }
        }
    }

    if (global.isdebugversionakos === true) {for (var i = 0; i < usage.length; i++) { common.PutToDebugLog(5, "cfusage " + usageNames[i] + ": " + usage[i]); }}

// get list of available call functions baesd on which engine is used
    var funcArray = availableFunc.split(',');
    var funchtml = '';

    if (common.isNull(funcArray) || funcArray.length < 1)
    {
        common.PutToDebugLog(2, 'ERROR, _call: AddCallFunctions no available callfunctions (3)');
        return;
    }
    
// wheter to display more button
    var dispmorebtn = false;
    if (global.nrOfCallfunctionsToDisplay === 0) { global.nrOfCallfunctionsToDisplay = 5; }
    if (global.nrOfCallfunctionsToDisplay > funcArray.length) { global.nrOfCallfunctionsToDisplay = funcArray.length; }
    	
    if (funcArray.length > 5) dispmorebtn = true;
    
// build html
    var count = 0;
//    if (common.isNull(content) || content.length < 10) // if content not yet added, then add it
//    {
    var template = '' +
        '<div class="callfunc_btn_container">' +
            '<button class="ui-btn callfunc_btn noshadow" data-theme="b" id="btn_[REPLACESTR]">' +
                '<img src="' + common.GetElementSource() + 'images/btn_[REPLACESTR]_txt.png" />' +
                '<span class="callfunc_status" id="[REPLACESTR]_status" >&nbsp;</span>' +
            '</button>' +
        '</div>';


    var spacer = '<div class="callfunc_spacer">&nbsp;</div>';

    for (var i = 0; i < usageNames.length; i++)
    {
        var cfitem = usageNames[i];
        if (common.isNull(cfitem) || common.Trim(cfitem).length < 1 ) { continue; }
        if ((availableFunc.toLowerCase()).indexOf(cfitem) < 0) { continue; }

        // WebRTC engine hasn't got conference
        if (common.getuseengine() === global.ENGINE_WEBRTC && cfitem === 'conference') { continue; }

    // conference, transfer, mute, hold, speaker, numpad, bluetooth, chat, video
        var item = common.ReplaceAll(template, '[REPLACESTR]', cfitem);
        funchtml = funchtml + item;
        if (i < global.nrOfCallfunctionsToDisplay - 1) { funchtml = funchtml + spacer; }

        count++;

    // add moer button and stop adding cf items
        if (dispmorebtn && count > 3)
        {
            var item = template.replace('btn_[REPLACESTR]_txt.png', 'menu.png');
            item = common.ReplaceAll(item, '[REPLACESTR]', 'more');
            funchtml = funchtml + item;
            count++;
            break;
        }
    }
    
    $('#callfunctions_layout').html(funchtml);

// attach click listeners   conference,transfer,numpad,mute,hold,speaker
    $('#btn_callforward').off('click');
    $('#btn_callforward').on('click', function(event) { CallfunctionsOnclick('callforward'); });
    
    $('#btn_conference').off('click');
    $('#btn_conference').on('click', function(event) { CallfunctionsOnclick('conference'); });

    $('#btn_transfer').off('click');
    $('#btn_transfer').on('click', function(event) { CallfunctionsOnclick('transfer'); });

    $('#btn_numpad').off('click');
    $('#btn_numpad').on('click', function(event) { CallfunctionsOnclick('numpad'); });

    $('#btn_mute').off('click');
    $('#btn_mute').on('click', function(event) { CallfunctionsOnclick('mute'); });

    $('#btn_hold').off('click');
    $('#btn_hold').on('click', function(event) { CallfunctionsOnclick('hold'); });

    $('#btn_speaker').off('click');
    $('#btn_speaker').on('click', function(event) { CallfunctionsOnclick('speaker'); });

    $('#btn_chat').off('click');
    $('#btn_chat').on('click', function(event) { CallfunctionsOnclick('chat'); });
    
    $('#btn_more').off('click');
    $('#btn_more').on('click', function(event) { CallfunctionsOnclick('more'); });



    $('#btn_callforward').attr('title', stringres.get('hint_callforward'));
    $('#btn_conference').attr('title', stringres.get('hint_conference'));
    $('#btn_transfer').attr('title', stringres.get('hint_transfer'));
    $('#btn_numpad').attr('title', stringres.get('hint_dialpad_dtmf'));
    $('#btn_mute').attr('title', stringres.get('hint_mute'));
    $('#btn_hold').attr('title', stringres.get('hint_hold'));
    $('#btn_speaker').attr('title', stringres.get('hint_speaker'));
    $('#btn_chat').attr('title', stringres.get('hint_message'));
    $('#btn_more').attr('title', stringres.get('hint_more'));
//    }

// calculate width in percent
    if (count === 0) { count = global.nrOfCallfunctionsToDisplay; }
    var btnWidth = common.GetDeviceWidth() - ( (count - 1) * $(".callfunc_spacer").width() );
    
    btnWidth = Math.round(btnWidth * 100.0 / common.GetDeviceWidth() * 100) / 100;
    btnWidth = Math.floor(btnWidth / count * 100.0) / 100;

    btnWidth = btnWidth - 0.1;

    $(".callfunc_btn_container").width(btnWidth + '%');
    
    } catch(err) { common.PutToDebugLogException(2, "_call: AddCallFunctions", err); }
}

function CallfunctionsOnclick (func) // call page -> call function button on click
{
    try{
    if (common.isNull(func)) { return; }
    
    common.PutToDebugLog(4, 'EVENT, _call CallfunctionsOnclick func = ' + func);
    
    if (func === 'mute')
    {
        var success = Mute();
        if (!success) { return; }
    }
    
    if (func === 'hold')
    {
        var success = Hold();
        if (!success) { return; }
    }
    
    
    var status = document.getElementById(func + '_status');

    if (!common.isNull(status) && func !== 'conference' && func !== 'transfer' && func !== 'chat' && func !== 'more' && func !== 'callforward')
    {
        if ( $(status).hasClass('callfunc_status_on') )
        {
            $(status).removeClass('callfunc_status_on');
        }else
        {
            $(status).addClass('callfunc_status_on');
        }
    }
    
    if (func === 'callforward')     { Callforward(''); }
    if (func === 'conference')      { Conference(''); }
    if (func === 'transfer')        { Transfer(''); }
    if (func === 'speaker')         { Speaker(); }
    if (func === 'numpad')          { Numpad(); }
    if (func === 'chat')            { Chat(); }
    if (func === 'more')            { $('#btn_call_menu').click(); }

    } catch(err) { common.PutToDebugLogException(2, '_call: CallfunctionsOnclick', err); }
}

var audiowasvisible = false;
var volumewasvisible = false;
function Numpad() // show / hide numpad for DTMF
{
    try{
if (global.isdebugversionakos === true)
{
    AddLineUI();
    return;
}
    if ($('#numpad').css('display') === 'none')
    {
        if ($('#audiodevice_container').is(':visible')) { audiowasvisible = true; } else { audiowasvisible = false; }
        if ($('#volumecontrols').is(':visible')) { volumewasvisible = true; } else { volumewasvisible = false; }

        document.getElementById('numpad_number').innerHTML = '&nbsp;';
        $('#contact_image').hide();
        $('#audiodevice_container').hide();
        $('#volumecontrols').hide();
        $('#numpad').show();
        MeasureCall();
    }else
    {
        $('#numpad').hide();
        $('#contact_image').show();
        if (audiowasvisible) { $('#audiodevice_container').show(); }
        if (volumewasvisible) { $('#volumecontrols').show(); }
        MeasureCall();
    }
    
    } catch(err) { common.PutToDebugLogException(2, '_call: Numpad', err); }
}

function Conference(phoneNr) // popup
{
    try{
    common.PutToDebugLog(1, 'EVENT, ' + stringres.get('initiate_conference'));

    if (common.getuseengine() === global.ENGINE_WEBRTC && IsMizuServer() === false && common.GetParameter('conf_engineswitcheoffered') !== 'true')
    {
        var ep_webrtc = common.StrToInt(common.GetParameter2('enginepriority_webrtc'));
        var ep_java = common.StrToInt(common.GetParameter2('enginepriority_java'));
        var ep_ns = common.StrToInt(common.GetParameter2('enginepriority_ns'));
        
        if (ep_ns > 0 && ep_webrtc - ep_ns < 3 && common.CanIUseService() === true)
        {
            common.EngineSwitchConference('ns', phoneNr, Conference);
            return;
        }
        if (ep_java > 0 && ep_webrtc - ep_java < 3 && common.CanIUseApplet() === true)
        {
            common.EngineSwitchConference('java', phoneNr, Conference);
            return;
        }
    }
    
    if (global.isdebugversionakos)
    {
        common.GetContacts(function () {});
    }
    
// if is multiline, then try to find another active call and connect them whitout asking for number
    if (common.IsMultiline() === 1)
    {
        for (var i = 0; i < global.ep.length; i++)
        {
            if (common.isNull(global.ep[i]) || global.ep[common.EP_FLAGDEL] === 'true') { continue; }

            var ln = common.StrToInt(global.ep[i][common.EP_LINE]);

            if (ln !== global.aline) // we found another active call
            {
                var nr = global.ep[i][common.EP_DESTNR];
                if (!common.isNull(nr) && nr.length > 0)
                {
                    if(common.IsMizuServer() === true && IsConferenceRoom() === true) // means it's conference rooms, so just send invites via chat
                    {
                        // get currently active call number
                        var ep = common.GetEndpoint(global.aline, '', '', false);
                        common.SendConferenceInvites(nr, ep[common.EP_DESTNR]);

                        common.PutToDebugLog(2, 'EVENT, _call: Conference, multiline conference: ' + nr + ' AND ' + ep[common.EP_DESTNR]);
                    }else
                    {
                        webphone_api.conference(nr, true);
                        common.SaveParameter('last_conference_number', nr);
                        common.PutToDebugLog(2, 'EVENT, _call: Conference, multiline conference: ' + nr);
                    }

                    return;
                }
            }
        }
    }
    
    var popupWidth = common.GetDeviceWidth();
    if ( !common.isNull(popupWidth) && common.IsNumber(popupWidth) && popupWidth > 100 )
    {
        popupWidth = Math.floor(popupWidth / 1.2);
    }else
    {
        popupWidth = 220;
    }
    var btnimage = 'btn_add_contact_txt.png';
    
    var template = '' +
'<div id="conference_popup" data-role="popup" class="ui-content messagePopup" data-overlay-theme="a" data-theme="a" style="max-width:' + popupWidth + 'px;">' +

    '<div data-role="header" data-theme="b">' +
        '<a href="javascript:;" data-role="button" data-icon="delete" data-iconpos="notext" class="ui-btn-right closePopup">Close</a>' +
        '<h1 class="adialog_title">' + stringres.get('conference_title') + '</h1>' +
    '</div>' +
    '<div role="main" class="ui-content adialog_content adialog_btn_nexttoinput">' +
        '<span>' + stringres.get('phone_nr') + '</span>' +
        '<div style="clear: both;"><!--//--></div>' +
        '<input type="text" id="conference_input" name="setting_item" data-theme="a"/>' +
        '<button id="btn_pickct" class="btn_nexttoinput ui-btn ui-btn-corner-all ui-btn-b noshadow"><img src="' + common.GetElementSource() + 'images/' + btnimage + '"></button>' +
    '</div>' +
    '<div data-role="footer" data-theme="b" class="adialog_footer">' +
        '<a href="javascript:;" id="adialog_positive" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back" data-transition="flow">' + stringres.get('btn_ok') + '</a>' +
        '<a href="javascript:;" id="adialog_negative" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back">' + stringres.get('btn_cancel') + '</a>' +
    '</div>' +
'</div>';

    var popupafterclose = function () {};

    $.mobile.activePage.append(template).trigger("create");
    //$.mobile.activePage.append(template).trigger("pagecreate");

    $.mobile.activePage.find(".closePopup").bind("tap", function (e)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");
    });

    $.mobile.activePage.find(".messagePopup").popup().popup("open").bind(
    {
        popupafterclose: function ()
        {
            $(this).unbind("popupafterclose").remove();
            $('#adialog_positive').off('click');
            $('#adialog_negative').off('click');
            $('#btn_pickct').off('click');
            popupafterclose();
        }
    });
    
// listen for enter onclick, and click OK button
/* no need for this, because it reloads the page
    $( "#conference_popup" ).keypress(function( event )
    {
        if ( event.which === 13)
        {
            event.preventDefault();
            $("#adialog_positive").click();
        }else
        {
            return;
        }
    });*/

    var textBox = document.getElementById('conference_input');
    
    var lastConferenceNumber = common.GetParameter("last_conference_number");

    if (!common.isNull(lastConferenceNumber) && lastConferenceNumber.length > 1)
    {
        textBox.value = common.Trim(lastConferenceNumber);
    }
    
    if (!common.isNull(phoneNr) && phoneNr.length > 0) { textBox.value = phoneNr; }

    if (!common.isNull(textBox)) { textBox.focus(); } // setting cursor to text input

    $('#adialog_positive').on('click', function (event)
    {
        common.PutToDebugLog(5,'EVENT, call Conference ok onclick');

        var textboxval = common.Trim(textBox.value);
        
        if (!common.isNull(textboxval) && textboxval.length > 0)
        {
            if(common.IsMizuServer() === true && IsConferenceRoom() === true) // means it's conference rooms, so just send invites via chat
            {
                common.SendConferenceInvites(textboxval, callnumber);
            }else
            {
                webphone_api.conference(textboxval, true);
                common.SaveParameter('last_conference_number', textboxval);
            }
        }else
        {
            common.ShowToast(stringres.get('err_msg_4'));
            $.mobile.back();
        }
    });

    $('#adialog_negative').on('click', function (event)
    {
        ;
    });

    $('#btn_pickct').on('click', function (event)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");

        $( '#conference_popup' ).on( 'popupafterclose', function( event )
        {
            $( '#conference_popup' ).off( 'popupafterclose' );

            common.PickContact(Conference);
        });
    });
    
    /*btnInterconnect.setOnClickListener(new View.OnClickListener()
    {
                    public void onClick(View v)
                    {
                            CommonGUI.GetObj().PutToDebugLog(5,"EVENT, call Conference interconnect onclick");

                            if (PhoneService.instance != null && PhoneService.instance.sipStack != null)
                                    PhoneService.instance.sipStack.API_Conf(-1, "");

                            alert.cancel();
                    }
    });*/
    
    CFUsageClickCount(CLICK_CONFERENCE);

    } catch(err) { common.PutToDebugLogException(2, '_call: Conference', err); }
}

function Callforward(phoneNr) // popup
{
    try{
    common.PutToDebugLog(1, 'EVENT, ' + stringres.get('initiate_callforward'));
    
    var popupWidth = common.GetDeviceWidth();
    if ( !common.isNull(popupWidth) && common.IsNumber(popupWidth) && popupWidth > 100 )
    {
        popupWidth = Math.floor(popupWidth / 1.2);
    }else
    {
        popupWidth = 220;
    }
    var btnimage = 'btn_callforward_txt.png';
    
    var template = '' +
'<div id="callforward_popup" data-role="popup" class="ui-content messagePopup" data-overlay-theme="a" data-theme="a" style="max-width:' + popupWidth + 'px;">' +

    '<div data-role="header" data-theme="b">' +
        '<a href="javascript:;" data-role="button" data-icon="delete" data-iconpos="notext" class="ui-btn-right closePopup">Close</a>' +
        '<h1 class="adialog_title">' + stringres.get('callforward_title') + '</h1>' +
    '</div>' +
    '<div role="main" class="ui-content adialog_content adialog_btn_nexttoinput">' +
        '<span>' + stringres.get('phone_nr') + '</span>' +
        '<div style="clear: both;"><!--//--></div>' +
        '<input type="text" id="callforward_input" name="setting_item" data-theme="a"/>' +
        '<button id="btn_pickct" class="btn_nexttoinput ui-btn ui-btn-corner-all ui-btn-b noshadow"><img src="' + common.GetElementSource() + 'images/' + btnimage + '"></button>' +
    '</div>' +
    '<div data-role="footer" data-theme="b" class="adialog_footer">' +
        '<a href="javascript:;" id="adialog_positive" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back" data-transition="flow">' + stringres.get('btn_ok') + '</a>' +
        '<a href="javascript:;" id="adialog_negative" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back">' + stringres.get('btn_cancel') + '</a>' +
    '</div>' +
'</div>';

    var popupafterclose = function () {};

    $.mobile.activePage.append(template).trigger("create");
    //$.mobile.activePage.append(template).trigger("pagecreate");

    $.mobile.activePage.find(".closePopup").bind("tap", function (e)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");
    });

    $.mobile.activePage.find(".messagePopup").popup().popup("open").bind(
    {
        popupafterclose: function ()
        {
            $(this).unbind("popupafterclose").remove();
            $('#adialog_positive').off('click');
            $('#adialog_negative').off('click');
            $('#btn_pickct').off('click');
            popupafterclose();
        }
    });
    
// listen for enter onclick, and click OK button
/* no need for this, because it reloads the page
    $( "#callforward_popup" ).keypress(function( event )
    {
        if ( event.which === 13 )
        {
            event.preventDefault();
            $("#adialog_positive").click();
        }else
        {
            return;
        }
    });
*/
    var textBox = document.getElementById('callforward_input');
    /*
    var lastTransferNumber = common.GetParameter("last_transfer_number");

    if (!common.isNull(lastTransferNumber) && lastTransferNumber.length > 1)
    {
        textBox.value = common.Trim(lastTransferNumber);
    }*/
    
    if (!common.isNull(phoneNr) && phoneNr.length > 0) { textBox.value = phoneNr; }

    if (!common.isNull(textBox)) { textBox.focus(); } // setting cursor to text input

    $('#adialog_positive').on('click', function (event)
    {
        common.PutToDebugLog(5,'EVENT, call Callforward ok onclick');

        var textboxval = common.Trim(textBox.value);
        
        if (!common.isNull(textboxval) && textboxval.length > 0)
        {
            webphone_api.forward(textboxval);
//            common.SaveParameter('last_transfer_number', textboxval);
        }else
        {
            common.ShowToast(stringres.get('err_msg_4'));
            $.mobile.back();
        }
    });

    $('#adialog_negative').on('click', function (event)
    {
        ;
    });

    $('#btn_pickct').on('click', function (event)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");

        $( '#callforward_popup' ).on( 'popupafterclose', function( event )
        {
            $( '#callforward_popup' ).off( 'popupafterclose' );

            common.PickContact(Callforward);
        });
    });
    
    /*btnInterconnect.setOnClickListener(new View.OnClickListener()
    {
                    public void onClick(View v)
                    {
                            CommonGUI.GetObj().PutToDebugLog(5,"EVENT, call Conference interconnect onclick");

                            if (PhoneService.instance != null && PhoneService.instance.sipStack != null)
                                    PhoneService.instance.sipStack.API_Conf(-1, "");

                            alert.cancel();
                    }
    });*/
    
    CFUsageClickCount(CLICK_CALLFORWARD);

    } catch(err) { common.PutToDebugLogException(2, '_call: Callforward', err); }
}

function Transfer(phoneNr) // popup
{
    try{
    common.PutToDebugLog(1, 'EVENT, ' + stringres.get('initiate_call_transfer'));
    
/*
    if (common.getuseengine() === global.ENGINE_WEBRTC && common.GetParameter('transf_engineswitcheoffered') !== 'true')
    {
        var ep_webrtc = common.StrToInt(common.GetParameter2('enginepriority_webrtc'));
        var ep_java = common.StrToInt(common.GetParameter2('enginepriority_java'));
        var ep_ns = common.StrToInt(common.GetParameter2('enginepriority_ns'));
        
        if (ep_ns > 0 && ep_webrtc - ep_ns < 3 && common.CanIUseService() === true)
        {
            common.EngineSwitchTransfer('ns', phoneNr, Transfer);
            return;
        }
        if (ep_java > 0 && ep_webrtc - ep_java < 3 && common.CanIUseApplet() === true)
        {
            common.EngineSwitchConference('java', phoneNr, Transfer);
            return;
        }
    }
*/
    if (global.isdebugversionakos)
    {
        common.GetContacts(function () {});
    }
    
/*
// if is multiline, then try to find another active call and connect them whitout asking for number
    if (common.IsMultiline() === 1)
    {
        for (var i = 0; i < global.ep.length; i++)
        {
            if (common.isNull(global.ep[i]) || global.ep[common.EP_FLAGDEL] === 'true') { continue; }

            var ln = common.StrToInt(global.ep[i][common.EP_LINE]);

            if (ln !== global.aline) // we found another active call
            {
                var nr = global.ep[i][common.EP_DESTNR];
                if (!common.isNull(nr) && nr.length > 0 && nr !== callnumber)
                {
                    webphone_api.transfer(nr, global.aline);
                    common.SaveParameter('last_transfer_number', nr);
                    common.PutToDebugLog(2, 'EVENT, _call: Transfer, multiline transfer: ' + nr);

                    return;
                }
            }
        }
    }
*/
    
    var popupWidth = common.GetDeviceWidth();
    if ( !common.isNull(popupWidth) && common.IsNumber(popupWidth) && popupWidth > 100 )
    {
        popupWidth = Math.floor(popupWidth / 1.2);
    }else
    {
        popupWidth = 220;
    }
    var btnimage = 'btn_transfer_txt.png';
    
    var template = '' +
'<div id="transfer_popup" data-role="popup" class="ui-content messagePopup" data-overlay-theme="a" data-theme="a" style="max-width:' + popupWidth + 'px;">' +

    '<div data-role="header" data-theme="b">' +
        '<a href="javascript:;" data-role="button" data-icon="delete" data-iconpos="notext" class="ui-btn-right closePopup">Close</a>' +
        '<h1 class="adialog_title">' + stringres.get('transfer_title') + '</h1>' +
    '</div>' +
    '<div role="main" class="ui-content adialog_content adialog_btn_nexttoinput">' +
        '<span>' + stringres.get('phone_nr') + '</span>' +
        '<div style="clear: both;"><!--//--></div>' +
        '<input type="text" id="transfer_input" name="setting_item" data-theme="a"/>' +
        '<button id="btn_pickct" class="btn_nexttoinput ui-btn ui-btn-corner-all ui-btn-b noshadow"><img src="' + common.GetElementSource() + 'images/' + btnimage + '"></button>' +
    '</div>' +
    '<div data-role="footer" data-theme="b" class="adialog_footer">' +
        '<a href="javascript:;" id="adialog_positive" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back" data-transition="flow">' + stringres.get('btn_ok') + '</a>' +
        '<a href="javascript:;" id="adialog_negative" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back">' + stringres.get('btn_cancel') + '</a>' +
    '</div>' +
'</div>';

    var popupafterclose = function () {};

    $.mobile.activePage.append(template).trigger("create");
    //$.mobile.activePage.append(template).trigger("pagecreate");

    $.mobile.activePage.find(".closePopup").bind("tap", function (e)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");
    });

    $.mobile.activePage.find(".messagePopup").popup().popup("open").bind(
    {
        popupafterclose: function ()
        {
            $(this).unbind("popupafterclose").remove();
            $('#adialog_positive').off('click');
            $('#adialog_negative').off('click');
            $('#btn_pickct').off('click');
            popupafterclose();
        }
    });
    
// listen for enter onclick, and click OK button
/* no need for this, because it reloads the page
    $( "#transfer_popup" ).keypress(function( event )
    {
        if ( event.which === 13 )
        {
            event.preventDefault();
            $("#adialog_positive").click();
        }else
        {
            return;
        }
    });*/

    var textBox = document.getElementById('transfer_input');
    
    var lastTransferNumber = common.GetParameter("last_transfer_number");

    if (!common.isNull(lastTransferNumber) && lastTransferNumber.length > 1)
    {
        textBox.value = common.Trim(lastTransferNumber);
    }
    
    if (!common.isNull(phoneNr) && phoneNr.length > 0) { textBox.value = phoneNr; }

    if (!common.isNull(textBox)) { textBox.focus(); } // setting cursor to text input

    $('#adialog_positive').on('click', function (event)
    {
        common.PutToDebugLog(5,'EVENT, call Transfer ok onclick');

        var textboxval = common.Trim(textBox.value);
        
        if (!common.isNull(textboxval) && textboxval.length > 0)
        {
            webphone_api.transfer(textboxval, 2);
            common.SaveParameter('last_transfer_number', textboxval);
        }else
        {
            common.ShowToast(stringres.get('err_msg_4'));
            $.mobile.back();
        }
    });

    $('#adialog_negative').on('click', function (event)
    {
        ;
    });

    $('#btn_pickct').on('click', function (event)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");

        $( '#transfer_popup' ).on( 'popupafterclose', function( event )
        {
            $( '#transfer_popup' ).off( 'popupafterclose' );

            common.PickContact(Transfer);
        });
    });
    
    /*btnInterconnect.setOnClickListener(new View.OnClickListener()
    {
                    public void onClick(View v)
                    {
                            CommonGUI.GetObj().PutToDebugLog(5,"EVENT, call Conference interconnect onclick");

                            if (PhoneService.instance != null && PhoneService.instance.sipStack != null)
                                    PhoneService.instance.sipStack.API_Conf(-1, "");

                            alert.cancel();
                    }
    });*/
    
    CFUsageClickCount(CLICK_TRANSFER);

    } catch(err) { common.PutToDebugLogException(2, '_call: Transfer', err); }
}

function Mute() // :boolean   handle Mute - onClick 
{
    try{
    //boolean muteSuccess = sipStack.API_Mute(-1, phoneService.muteState);
    var muteDirection = common.GetParameterInt('defmute', 2);

    var mstate = !common.GetMuteState(-1);
    var muteSuccess = webphone_api.mute(mstate, muteDirection, -1);

    CFUsageClickCount(CLICK_MUTE);

    /*if (muteSuccess)
    {*/
        if (mstate)
        {
            common.PutToDebugLog(1, 'STATUS, ' + stringres.get('muted'));
        }else
        {
            common.PutToDebugLog(1, 'STATUS, ' + stringres.get('unmuted'));
        }
        
        common.SetMuteState(global.aline, mstate);
        return true;
    /*}*/
    } catch(err) { common.PutToDebugLogException(2, '_call: Mute', err); }
    return false;
}

function Hold() // :boolean  handle Hold - onClick 
{
    try{
    var hstate = !common.GetHoldState(-1);
    var holdSuccess = webphone_api.hold(hstate, -1);

    CFUsageClickCount(CLICK_HOLD);

    if (holdSuccess)
    {
        common.SetHoldState(global.aline, hstate);
        return true;
    }
    
    } catch(err) { common.PutToDebugLogException(2, '_call: Hold', err); }
    return false;
}

function Speaker()
{
    try{
    alert('speaker on / off');
    
    } catch(err) { common.PutToDebugLogException(2, '_call: Hold', err); }
}

function Chat()
{
    try{
    if (hanguponchat === true)
    {
        HangupCall();
    }
    
    common.StartMsg(callnumber, '', '_call');
    CFUsageClickCount(CLICK_CHAT);
    
    } catch(err) { common.PutToDebugLogException(2, '_call: Chat', err); }
}

var CLICK_CONFERENCE = 0;
var CLICK_TRANSFER = 1;
var CLICK_MUTE = 2;
var CLICK_HOLD = 3;
var CLICK_SPEAKER = 4;
var CLICK_NUMAPD = 5;
var CLICK_BLUETOOTH = 6;
var CLICK_CHAT = 7;
var CLICK_VIDEO = 8;
var CLICK_CALLFORWARD = 9;

function CFUsageClickCount(which) // count the number of clicks on call function buttons
{
    var lastoop = 0;
    var resetVals = false; // reset values (divide by 2 if any value is > 20 or < -20)
    try{ // conference, transfer, mute, hold, speaker, numpad, bluetooth, chat, video

    var usageStr = common.GetParameter('callfunctionsbtnusage');
    lastoop = 1;
    if (common.isNull(usageStr) || usageStr.length < 1) return;
    lastoop = 2;
    var usage = usageStr.split(',');
    lastoop = 3;
    var usageInt = [];
    lastoop = 4;
    for (var i = 0; i < usage.length; i++)
    {
            usageInt[i] = common.StrToInt(usage[i]);
            if (usageInt[i] > 20 || usageInt[i] < -20) resetVals = true;
    }
    lastoop = 5;
    switch(which)
    {
            case CLICK_CONFERENCE:	usageInt[CLICK_CONFERENCE]++; return;
            case CLICK_TRANSFER:	usageInt[CLICK_TRANSFER]++; return;
            case CLICK_MUTE:		usageInt[CLICK_MUTE]++; return;
            case CLICK_HOLD:		usageInt[CLICK_HOLD]++; return;
            case CLICK_SPEAKER:		usageInt[CLICK_SPEAKER]++; return;
            case CLICK_NUMAPD:		usageInt[CLICK_NUMAPD]++; return;
            case CLICK_BLUETOOTH:	usageInt[CLICK_BLUETOOTH]++; return;
            case CLICK_CHAT:		usageInt[CLICK_CHAT]++; return;
            case CLICK_VIDEO:		usageInt[CLICK_VIDEO]++; return;
    }

    if (resetVals)
    {
            for (var i = 0; i < usageInt.length; i++)
            {
                usageInt[i] = Math.floor(usageInt[i] / 2);
            }
    }

    lastoop = 6;
    usageStr = usageInt[CLICK_CONFERENCE] + ',' + usageInt[CLICK_TRANSFER] + ',' + usageInt[CLICK_MUTE] + ',' + usageInt[CLICK_HOLD] +',' + usageInt[CLICK_SPEAKER] + ','
            + usageInt[CLICK_NUMAPD] + ',' + usageInt[CLICK_BLUETOOTH] + ',' + usageInt[CLICK_CHAT] + ',' + usageInt[CLICK_VIDEO];
    lastoop = 7;
    common.SaveParameter('callfunctionsbtnusage', usageStr);
    lastoop = 8;
    } catch(err) { common.PutToDebugLogException(2, '_call: CFUsageClickCount (' + lastoop.toString() + ')', err); }
}

var MENUITEM_CALL_IGNORE = '#menuitem_call_ignore';
var MENUITEM_CALL_CALLFORWARD = '#menuitem_call_callforward';
var MENUITEM_CALL_CONFERENCE = '#menuitem_call_conference';
var MENUITEM_CALL_TRANSFER = '#menuitem_call_transfer';
var MENUITEM_CALL_NUMPAD = '#menuitem_call_numpad';
var MENUITEM_CALL_MUTE = '#menuitem_call_mute';
var MENUITEM_CALL_HOLD = '#menuitem_call_hold';
var MENUITEM_CALL_SPEAKER = '#menuitem_call_speaker';
var MENUITEM_CALL_MESSAGE = '#menuitem_call_message';
var MENUITEM_VOLUME_CONTROLS = '#menuitem_volume_controls';
var MENUITEM_AUDIO_DEVICE = '#menuitem_audio_device';
var MENUITEM_RECALL_VIDEO = '#menuitem_recall_video';
var MENUITEM_CALLPARK = '#menuitem_callpark';
var MENUITEM_MULTILINECALL = '#menuitem_multilinecall';

function CreateOptionsMenu (menuId) // adding items to menu, called from html
{
    try{
// remove data transition for windows softphone, because it's slow
    if (common.GetParameter('devicetype') === common.DEVICE_WIN_SOFTPHONE())
    {
        $( "#btn_call_menu" ).removeAttr('data-transition');
    }

    if ( common.isNull(menuId) || menuId.lenght < 1 ) { common.PutToDebugLog(2, "ERROR, _call: CreateOptionsMenu menuid null"); return; }

    if ($(menuId).length <= 0) { common.PutToDebugLog(2, "ERROR, _call: CreateOptionsMenu can't get reference to Menu"); return; }

    if (menuId.charAt(0) !== '#') { menuId = '#' + menuId; }
    
    $(menuId).html('');
    var featureset = common.GetParameterInt('featureset', 10);
    
    var availableFunc = common.GetAvailableCallfunctions();
    if ( common.isNull(availableFunc) || availableFunc.length < 3)
    {
        common.PutToDebugLog(2, 'ERROR, _call: CreateOptionsMenu no available callfunctions (1)');
        return;
    }
    
    if (showignore === true)
    {
        $(menuId).append( '<li id="' + MENUITEM_CALL_IGNORE + '"><a data-rel="back">' + stringres.get('menu_ignore') + '</a></li>' ).listview('refresh');
    }
    
    if (featureset > 5 && availableFunc.indexOf('callforward') >= 0 && showcallfwd === true)
    {
        $(menuId).append( '<li id="' + MENUITEM_CALL_CALLFORWARD + '"><a data-rel="back">' + stringres.get('menu_callforward') + '</a></li>' ).listview('refresh');
    }
    if (featureset > 5)
    {
        if (availableFunc.indexOf('conference') >= 0 || (common.IsMizuServer() === true && IsConferenceRoom() === true)) // for conference rooms
        {
            $(menuId).append( '<li id="' + MENUITEM_CALL_CONFERENCE + '"><a data-rel="back">' + stringres.get('menu_conference') + '</a></li>' ).listview('refresh');
        }
    }
    if (featureset > 0 && availableFunc.indexOf('transfer') >= 0 && global.checkIfCallActive === true)
    {
        $(menuId).append( '<li id="' + MENUITEM_CALL_TRANSFER + '"><a data-rel="back">' + stringres.get('menu_transfer') + '</a></li>' ).listview('refresh');
    }
    if (availableFunc.indexOf('numpad') >= 0)
    {
        $(menuId).append( '<li id="' + MENUITEM_CALL_NUMPAD + '"><a data-rel="back">' + stringres.get('menu_numpad') + '</a></li>' ).listview('refresh');
    }
    if (featureset > 0 && availableFunc.indexOf('mute') >= 0 && global.checkIfCallActive === true)
    {
        $(menuId).append( '<li id="' + MENUITEM_CALL_MUTE + '"><a data-rel="back">' + stringres.get('menu_mute') + '</a></li>' ).listview('refresh');
    }
    if (featureset > 0 && availableFunc.indexOf('hold') >= 0 && global.checkIfCallActive === true)
    {
        $(menuId).append( '<li id="' + MENUITEM_CALL_HOLD + '"><a data-rel="back">' + stringres.get('menu_hold') + '</a></li>' ).listview('refresh');
    }
    if (featureset > 0 && availableFunc.indexOf('speaker') >= 0)
    {
        $(menuId).append( '<li id="' + MENUITEM_CALL_SPEAKER + '"><a data-rel="back">' + stringres.get('menu_speaker') + '</a></li>' ).listview('refresh');
    }
    if (availableFunc.indexOf('chat') >= 0)
    {
        $(menuId).append( '<li id="' + MENUITEM_CALL_MESSAGE + '"><a data-rel="back">' + stringres.get('menu_message') + '</a></li>' ).listview('refresh');
    }
    
// show Volume controls/Hide Volume  in menu, if not always displayed
    if (common.GetParameterBool('displayvolumecontrols', false) === false)
    {
        var voltitle = '';
        if ($('#volumecontrols').is(':visible'))
        {
            voltitle = stringres.get('menu_volumehide');
        }else
        {
            voltitle = stringres.get('menu_volumeshow');
        }
        
        $(menuId).append( '<li id="' + MENUITEM_VOLUME_CONTROLS + '"><a data-rel="back">' + voltitle + '</a></li>' ).listview('refresh');
    }
    
    if (common.GetParameter2('video') === '1' || (common.GetParameter2('video') === '-1' && common.getuseengine() === global.ENGINE_WEBRTC))
    {
        $(menuId).append( '<li id="' + MENUITEM_RECALL_VIDEO + '"><a data-rel="back">' + stringres.get('menu_videorecall') + '</a></li>' ).listview('refresh');
    }

// show Audio device/Hide Audio device  in menu, if not always displayed
    /*if (common.GetParameterBool('displayaudiodevice', false) === false)
    {
        var audiotitle = '';
        if ($('#audiodevice_container').is(':visible'))
        {
            audiotitle = stringres.get('menu_audiodevicehide');
        }else
        {
            audiotitle = stringres.get('menu_audiodeviceshow');
        }
        
        $(menuId).append( '<li id="' + MENUITEM_AUDIO_DEVICE + '"><a data-rel="back">' + audiotitle + '</a></li>' ).listview('refresh');
    }*/

    if ((common.getuseengine() === global.ENGINE_WEBRTC && (common.GetBrowser() === 'Firefox' || common.GetBrowser() === 'Chrome'))
        || common.GetParameter('devicetype') === common.DEVICE_WIN_SOFTPHONE() || common.getuseengine() === global.ENGINE_SERVICE || common.getuseengine() === global.ENGINE_WEBPHONE)
    {
        $(menuId).append( '<li id="' + MENUITEM_AUDIO_DEVICE + '"><a data-rel="back">' + stringres.get('menu_audiodeviceshow') + '</a></li>' ).listview('refresh');
    }
    
    var cpnr = common.GetConfig('callparknumber');
    if (common.isNull(cpnr) || cpnr.length < 0) { cpnr = common.GetParameter2('callparknumber'); }
    if (cpnr.length > 0)
    {
        $(menuId).append( '<li id="' + MENUITEM_CALLPARK + '"><a data-rel="back">' + stringres.get('menu_callpark') + '</a></li>' ).listview('refresh');
    }
    
    if (common.IsMultiline() === 1)
    {
        $(menuId).append( '<li id="' + MENUITEM_MULTILINECALL + '"><a data-rel="back">' + stringres.get('menu_multilinecall') + '</a></li>' ).listview('refresh');
    }

    return true;

    } catch(err) { common.PutToDebugLogException(2, "_call: CreateOptionsMenu", err); }
    
    return false;
}

function MenuItemSelected(itemid)
{
    try{
    if (common.isNull(itemid) || itemid.length < 1) { return; }
    
    $( '#call_menu' ).on( 'popupafterclose', function( event )
    {
        $( '#call_menu' ).off( 'popupafterclose' );
        
        switch (itemid)
        {
            case MENUITEM_CALL_IGNORE:
                webphone_api.ignore();
                break;
            case MENUITEM_CALL_CALLFORWARD:
                CallfunctionsOnclick('callforward');
                break;
            case MENUITEM_CALL_CONFERENCE:
                CallfunctionsOnclick('conference');
                break;
            case MENUITEM_CALL_TRANSFER:
                CallfunctionsOnclick('transfer');
                break;
            case MENUITEM_CALL_NUMPAD:
                CallfunctionsOnclick('numpad');
                break;
            case MENUITEM_CALL_MUTE:
                CallfunctionsOnclick('mute');
                break;
            case MENUITEM_CALL_HOLD:
                CallfunctionsOnclick('hold');
                break;
            case MENUITEM_CALL_SPEAKER:
                CallfunctionsOnclick('speaker');
                break;
            case MENUITEM_CALL_MESSAGE:
                CallfunctionsOnclick('chat');
                break;
            case MENUITEM_VOLUME_CONTROLS:
                ShowHideVolumeControls();
                break;
            case MENUITEM_AUDIO_DEVICE:
                //ShowHideAudioDevice();
                common.AudioDevicePopup();
                break;
            case MENUITEM_RECALL_VIDEO:
                HangupCall();
                setTimeout(function ()
                {
                    webphone_api.videocall(callnumber);
                }, 250);
                break;
            case MENUITEM_CALLPARK:
                CallPark();
                break;
            case MENUITEM_MULTILINECALL:
                NewMultilineCall();
                break;
        }
    });
    } catch(err) { common.PutToDebugLogException(2, "_call: MenuItemSelected", err); }
}

function CallPark()
{
    try{
    var cpnr = common.GetConfig('callparknumber');
    if (common.isNull(cpnr) || cpnr.length < 0) { cpnr = common.GetParameter2('callparknumber'); }
    
    common.PutToDebugLog(3, 'EVENT, call CallPark onclick: ' + cpnr);

    if (cpnr.length < 1) { return; }

    webphone_api.dtmf(cpnr);

    } catch(err) { common.PutToDebugLogException(2, "_call: CallPark", err); }
}

function ShowHideVolumeControls()
{
    try{
    if ($('#volumecontrols').is(':visible'))
    {
        $('#volumecontrols').hide();
    }else
    {
        $('#volumecontrols').show();
    }

    MeasureCall();

    } catch(err) { common.PutToDebugLogException(2, "_call: ShowHideVolumeControls", err); }
}

function ShowHideAudioDevice()
{
    try{
    if ($('#audiodevice_container').is(':visible'))
    {
        $('#audiodevice_container').hide();
    }else
    {
        $('#audiodevice_container').show();
    }

    MeasureCall();

    } catch(err) { common.PutToDebugLogException(2, "_call: ShowHideVolumeControls", err); }
}

function IsConferenceRoom() // check if called number is a conference room number
{
    try{
    if (common.isNull(callnumber) || callnumber.length < 0) { return false; }
    var cfr = common.GetParameter('received_confrooms')
    var list = cfr.split(',');
    for (var i = 0; i < list.length; i++)
    {
        if (list[i] === callnumber)
        {
            return true;
        }
    }

    } catch(err) { common.PutToDebugLogException(2, "_call: ShowHideVolumeControls", err); }
    return false;
}

function onStop(event)
{
    try{
    common.PutToDebugLog(4, "EVENT, _call: onStop");
    global.isCallStarted = false;
    
    global.hangupPressedCount = 0;
    $('#call_duration').html('');
    global.rating = '';
    
    global.closeCallAtivity = false;
    plhandler.Cfin();
    
    global.lastRingEvenet = '';
    isvideo = false;
    
    if (!common.isNull(document.getElementById('page_call_additional_info')))
    {
        document.getElementById('page_call_additional_info').innerHTML = '';
    }
    $('#page_call_peer_details').html('');

    } catch(err) { common.PutToDebugLogException(2, "_call: onStop", err); }
}

function onDestroy (event)
{
    try{
    common.PutToDebugLog(4, "EVENT, _call: onDestroy");
    global.isCallStarted = false;
    $('#callfunctions_layout').html('');
    isvideo = false;
    $("#ml_buttons").html('');
    global.acallcount = 0;
    /*
    $("#btn_hangup").off('click');
    $("#btn_accept").off('click');
    $("#btn_reject").off('click');
    
    $('#btn_conference').off('click');
    $('#btn_transfer').off('click');
    $('#btn_numpad').off('click');
    $('#btn_mute').off('click');
    $('#btn_hold').off('click');
    $('#btn_speaker').off('click');*/
  
    } catch(err) { common.PutToDebugLogException(2, "_call: onDestroy", err); }
}

var callpage_public = {

    LineCliked: LineCliked,
    OnNewIncomingCall: OnNewIncomingCall,
    UpdateLineUI: UpdateLineUI
};
window.callpage_public = callpage_public;

// public members and methods
return {
    onCreate: onCreate,
    onStart: onStart,
    onStop: onStop,
    onDestroy: onDestroy,
    CloseCall: CloseCall,
    OnCallerHangup: OnCallerHangup,
    AcceptCall: AcceptCall,
    RejectCall: RejectCall
};
});