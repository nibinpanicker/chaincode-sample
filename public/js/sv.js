var txns = [];

$(document).on('ready', function() {

  $('input[name="voucherId"]').val(('SV' + randStr(6)).toUpperCase());

  $('#viewLink').click(function(){
    showViewPanel();
  });

  $('#issueLink').click(function(){
    $('input[name="voucherId"]').val(('SV' + randStr(6)).toUpperCase());
    $('select[name="issuer"]').val('Miles & More');
    $('input[name="owner"]').val('');
    $('select[name="voucherType"]').val('00');
    $('input[name="expiry"]').val('');
    $('input[name="value"]').val('');
    showIssuePanel();
  });

  $('#manageLink').click(function(){
    clearManageVoucher();
  });

  $('select[name="voucherType"]').change(function() {
    var det = getVoucherDetails($('select[name="voucherType"]').val());
    $('select[name="partner"]').val(det.partner);
    $('input[name="expiry"]').val(det.date);
    $('input[name="value"]').val(det.value);
  });

  $('#submitClear').click(function() {
    $('input[name="voucher"]').val('');
    $('#listBody').html('');
    txns = [];
    listVochers();
  });

  $('#submitListReq').click(function() {
    listVochers();
  });

  $('#issue').click(function(){
		var obj = 	{
						type: 'ISSUED',
						voucherId: $('input[name="voucherId"]').val().replace(' ', ''),
						voucherType: $('select[name="voucherType"]').val(),
						issuer: $('select[name="issuer"]').val(),
            value: $('input[name="value"]').val().replace(' ', ''),
            owner: $('input[name="owner"]').val(),
            expiry: $('input[name="expiry"]').val().replace(' ', ''),
						v: 1
					};
    console.log('issuing voucher for', obj);
		if(obj.voucherId && obj.voucherType && obj.issuer && obj.owner){
      console.log('sending voucher', obj, ws);
			ws.send(JSON.stringify(obj));
      setTimeout(function(){
    		showViewPanel();
    	}, 3000);
		}
		return false;
	});

  $('#searchVoucher').click(function() {
    searchVoucher();
  });

  $('#clearManageVoucher').click(function() {
    clearManageVoucher();
  });

  $('#markAsUsed').click(function(){
    var voucherId = $('input[name="searchVoucherId"]').val();
    console.log('Id is ' + voucherId);
    var found;
    if(voucherId) {
      if(txns.length == 0) {
        listVochers();
      }
      for(var i = 0; i < txns.length; i++) {
        if(txns[i].voucherId.indexOf(voucherId) >= 0 && txns[i].status.indexOf('ISSUED') >= 0) {
          found = txns[i];
        }
        if(txns[i].voucherId.indexOf(voucherId) >= 0 && txns[i].status.indexOf('USED') >= 0) {
          found = false;
          break;
        }
      }
      if(!found) {
          alert('Voucher has already been USED');
      } else {
        var obj = 	{
                type: 'USED',
                voucherId: found.voucherId,
                voucherType: found.voucherType,
                issuer: found.issuer,
                value: found.value,
                owner: found.owner,
                partner: $('select[name="partner"]').val(),
                expiry: found.expiry,
                v: 1
              };
        console.log('marking as used voucher for', obj);
        if(obj.voucherId && obj.voucherType && obj.issuer && obj.owner && obj.partner){
          console.log('sending voucher', obj, ws);
          ws.send(JSON.stringify(obj));
          setTimeout(function(){
            showViewPanel();
          }, 3000);
        }
      }
    }
		return false;
	});

});

function listVochers() {
  var voucherId = $('input[name="voucher"]').val();
  var html = '';
  if(!voucherId) {
    for(var i = blocks.length -1 ; i >= 0 ; i--) {
      if(blocks[i] != undefined && blocks[i].hasOwnProperty('id') && blocks[i].blockstats.transactions[0].type == 2) {
        var ccid = formatCCID(blocks[i].blockstats.transactions[0].type, blocks[i].blockstats.transactions[0].uuid, atob(blocks[i].blockstats.transactions[0].chaincodeID));
        var payload = atob(blocks[i].blockstats.transactions[0].payload);
        var formattedPayLoad = formatPayload(payload, ccid);
        var date = formatDate(blocks[i].blockstats.transactions[0].timestamp.seconds * 1000, '%M-%d-%Y %I:%m%p');
        var obj = {};
        obj.id = blocks[i].id;
        obj.payload = formattedPayLoad;
        var splitStr = formattedPayLoad.split("\n");
        console.log('split payload ->', splitStr, splitStr.length);
        if(splitStr.length >= 6) {
          obj.status = removeSpecialChars(splitStr[0].split(":")[0]);
          obj.voucherId = removeSpecialChars(splitStr[1]);
          obj.voucherType = removeSpecialChars(splitStr[2]);
          obj.issuer = removeSpecialChars(splitStr[3]);
          obj.owner = removeSpecialChars(splitStr[4]);
          obj.partner = removeSpecialChars(splitStr[5]);
          obj.expiry = removeSpecialChars(splitStr[6]);
          obj.value = removeSpecialChars(splitStr[7]);
          if(!(obj.expiry.indexOf('-') >= 1)) {
            obj.partner = removeSpecialChars(splitStr[6]);
            obj.expiry = removeSpecialChars(splitStr[7]);
            obj.value = removeSpecialChars(splitStr[8]);
          }
        }
        obj.date = date;
        txns.push(obj);
        console.log('After split ->',obj);
        html = html + '<tr><td>'+blocks[i].id+'</td><td>'+obj.voucherId+'<br><h6>['+getVoucherType(obj.voucherType)+']</h6></td><td>'+obj.issuer+'</td><td>'+obj.partner+'</td><td>'+obj.owner+'</td><td>'+obj.status+'</td><td>'+obj.expiry+'</td><td>'+obj.date+'</td></tr>';
        //console.log(blocks[i]);
      }
      $('#listBody').html(html);
    }
  } else {
    for(var i = 0; i < txns.length; i++) {
      //console.log(txns[i].id);
      if(txns[i].voucherId.indexOf(voucherId) >= 0 || txns[i].issuer.indexOf(voucherId) >= 0) {
        html = html + '<tr><td>'+txns[i].id+'</td><td>'+txns[i].voucherId+'<br><h6>['+getVoucherType(txns[i].voucherType)+']</h6></td><td>'+txns[i].issuer+'</td><td>'+txns[i].partner+'</td><td>'+txns[i].owner+'</td><td>'+txns[i].status+'</td><td>'+txns[i].expiry+'</td><td>'+txns[i].date+'</td></tr>';
      }
    }
    $('#listBody').html(html);
  }
}

function removeSpecialChars(str) {
  //return str.trim().replace(/[\u0008\u0012\u000F\u0005\u000E]/g,'');
  return str.trim().replace(/[^a-zA-Z0-9- _&+]/g,'');
}

function showViewPanel(){
  $('#viewPanel').fadeIn(300);
  $('#issuePanel').hide();
  $('#managePanel').hide();

  clearAll();
  listVochers();

  var part = window.location.pathname.substring(0,3);
  window.history.pushState({},'', part + '/view');						//put it in url so we can f5

  setTimeout(function(){
    ws.send(JSON.stringify({type: 'get', v: 1}));						//need to wait a bit
    ws.send(JSON.stringify({type: 'chainstats', v: 1}));
  }, 1000);
}

function showIssuePanel(){
  //clearAll();
  $('#issuePanel').fadeIn(300);
  $('#viewPanel').hide();

  var part = window.location.pathname.substring(0,3);
  window.history.pushState({},'', part + '/issue');						//put it in url so we can f5
}

function clearAll() {
    $('input[name="voucherId"]').val('');
    $('input[name="value"]').val('');
}

function getVoucherDetails(type) {
  var obj = {};

  var date = new Date();

  switch(type) {
    case "SA_E2B_UPGRADE" :
      obj.value = '20000';
      date.setDate(date.getDate() + 7);
      break;
    case "SA_B2F_UPGRADE" :
      obj.value = '28000';
      date.setDate(date.getDate() + 7);
      break;
    case "SA_LOUNGE_ACCESS" :
      obj.value = '20000';
      date.setDate(date.getDate() + 7);
      break;
    case "SA_EXTRA_LUGGAGE" :
      obj.value = '22000';
      date.setDate(date.getDate() + 7);
      break;
    default:
      obj.value = '10000';
      date.setDate(date.getDate() + 7);
      break;
  }

  obj.date = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();

  return obj;
}

function searchVoucher() {
  var voucherId = $('input[name="searchVoucherId"]').val();
  console.log('Id is ' + voucherId);
  var html = '';
  var found = false;
    if(voucherId) {
      if(txns.length == 0) {
        listVochers();
      }
      for(var i = 0; i < txns.length; i++) {
        console.log(txns[i].id);
        if(txns[i].voucherId.indexOf(voucherId) >= 0) {
          html = html + '<div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>['+txns[i].issuer+']</span>&nbsp;<span>'+txns[i].partner+'</span>&nbsp;<span>'+txns[i].owner+'</span>&nbsp;<span>'+txns[i].status+'</span>&nbsp;<span>['+txns[i].expiry+']</span>&nbsp;<span>'+txns[i].date+'</span></div>';
          found = true;
          break;
        }
      }
      if(!found) {
          html = html + '<span>Voucher not found</span>';
      }
      $('#showVoucher').html(html);
    }
  }

  function clearManageVoucher() {
      $('input[name="searchVoucherId"]').val('');
      $('select[name="partner"]').val('00');
      $('#showVoucher').html('');
  }

  function getVoucherType(code) {
      //console.log(code.trim().toString() + '' + code.trim().length);
      //console.log(code.charCodeAt(0).toString(16).toUpperCase());
      //console.log(String.fromCharCode(code.charCodeAt(0)));
      var desc;
      if(code.indexOf("SA_E2B_UPGRADE") >= 0) {
          console.log("Got SA_E2B_UPGRADE");
          desc = "Economy to Business Upgrade";
        } else if(code.indexOf("SA_B2F_UPGRADE") >= 0) {
          desc = "Business to First Class Upgrade";
        } else if(code.indexOf("SA_LOUNGE_ACCESS") >= 0) {
          desc  = "Lounge Access";
        } else if(code.indexOf("SA_EXTRA_LUGGAGE") >= 0) {
          desc =  "20 Kg Extra Luggage";
        } else {
          desc = code.trim();
        }
      return desc;
  }
