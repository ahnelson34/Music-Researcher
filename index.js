'use strict'
const apiKeyLastFm = '77041af4177c0e5538058219c30940b0'
const searchUrlLastFm = 'https://ws.audioscrobbler.com//2.0/'



function formatLastFmQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(api_key => `${encodeURIComponent(api_key)}=${encodeURIComponent(params[api_key])}`)
  return queryItems.join('&');
}

var searchHistory = [];

function fetchTopTracksLastFm(artist, similar) {
    const params = {
        api_key: apiKeyLastFm,
        artist,
        method: 'artist.gettoptracks',
        limit: 10,
        autocorrect: 1,
        format: 'json' 
      }; 
    const queryString = formatLastFmQueryParams(params)
    const url = searchUrlLastFm + '?' + queryString;
    
    console.log(url);
    
    return fetch(url);        
}

function getSimilarArtists(artist) {
  const params = {
      api_key: apiKeyLastFm,
      artist,
      method: 'artist.getsimilar',
      limit: 5,
      autocorrect: 1,
      format: 'json' 
    }; 
  const queryString = formatLastFmQueryParams(params)
  const url = searchUrlLastFm + '?' + queryString;
  
  console.log(url);
  
  return fetch(url);

};

function displaySimilarArtists(responseJson) {
  console.log(responseJson);
  $('#similar-artists-list').empty();
  if (responseJson.error != undefined || responseJson.similarartists.length == 0) {
    $('#similar-artists-list').append(
      `<p>No Similar Artists Found</p>`
    )
    $('#similar-artists').removeClass('hidden');  
    return;
  }

  for (let i=0; i < responseJson.similarartists.artist.length; i++){
    let artistName = responseJson.similarartists.artist[i].name.trim();
    $('#similar-artists-list').append(
      `<div class="accordion">
            <div class="accordion-header">${artistName}</div>
            <div class="accordion-content"><ul data-artist="${artistName}" id="video-list${i}"></ul></div>
      </div>`
    )
    
    refreshTopTracks(artistName, i);
    
  };
  $('#similar-artists').removeClass('hidden');  
};

$(function(){
  $("body").on("click", ".accordion .accordion-header", function() {
    $(this).toggleClass("active").next().slideToggle();
  });
})



const apiKeyYouTube = 'AIzaSyC3YDvPKPEQcKDodu7Koq5S8IhCGVbsRXA'; 
const searchURLYouTube = 'https://www.googleapis.com/youtube/v3/search';

function formatYouTubeQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
};


function getYouTubeVideo(query) {
  const params = {
    key: apiKeyYouTube,
    q: query,
    part: 'snippet',
    maxResults: 1,
    type: 'video'
  };
  const queryString = formatYouTubeQueryParams(params)
  const url = searchURLYouTube + '?' + queryString;

  console.log(url);

  return fetch(url);
}


//rotates placeholder
var inputPlaceholder = ["Queen", "Bob Marley", "Beyonce", "Kanye West", "Taylor Swift", "The Beatles", "Drake", "Frank Sinatra"];
setInterval(function() {
    $("input[type='text']").attr("placeholder", inputPlaceholder[inputPlaceholder.push(inputPlaceholder.shift())-1]);
}, 3000);

function resetHtmlHomeButtonClick() {
        $('#js-search-term').val(''); 
        $('#video-list').empty();
        $('#results','#js-error-message','#similar-artists','#search-history').addClass('hidden');
        $('.tabset').addClass('hidden');
        $('.site-info').removeClass('hidden');
}

function setHtmlSearchResults() {
      $('#similar-artists','#js-error-message','#results').addClass('hidden');
      $('.site-info').addClass('hidden');
      $('#video-list').empty();
      $('#search-history').removeClass('hidden');
      $('.tabset').removeClass('hidden');
      $('#tab1').prop('checked',true);
}

function computeHomeButton() {
    $('.appLogo').on('click', '.logo', function(event) {
      resetHtmlHomeButtonClick();
        
    });
}

function watchForm() {
    $('form').submit(event => {      
      event.preventDefault();
      setHtmlSearchResults();
      const searchTermLastFm = $('#js-search-term').val().trim();
      $('#video-list').attr('data-artist', searchTermLastFm);
      searchHistory.push(searchTermLastFm)
      if (searchHistory.length > 10) {
        searchHistory.shift();
      };
      console.log($('#search-history-list'))
      $('#search-history-list').empty();
      
      searchHistory.forEach(searchItem =>{
        $('#search-history-list').append(
          `<li>${searchItem}</li>`)
  
      });
       
      
    getSimilarArtists(searchTermLastFm)
      .then(response =>{
        if (response.ok) {
          return response.json();
        }
        throw new Error(response.statusText);
      })
      .then(responseJson => displaySimilarArtists(responseJson))
     
     refreshTopTracks(searchTermLastFm);

      });
    }
    
  function refreshTopTracks(artistName, similarId) {
        let $results = $(`ul[data-artist="${artistName}"]`);
        $results.html('<li class="searching">Searching...</li>');
        fetchTopTracksLastFm(artistName)
        .then(response => {
          if (response.ok) {
          return response.json();
          }
          throw new Error(response.statusText);
          
          })
          .then(responseJson => {   
            var videoList = []; 
            var videoQueries = [];     
            if (responseJson.toptracks == undefined) {
              var uiId = '#video-list'
                  if (similarId != undefined) {
                    uiId = `${uiId}${similarId}`
                  }

                  if (responseJson.error != undefined || responseJson.items.length == 0) {
                   $(uiId).append(
                     `<li>no video found</li>`
                   )
                   $('#results').removeClass('hidden');
                   return;
              }
            } 
            for (let i = 0; i < responseJson.toptracks.track.length; i++){
              $results.find('.searching').remove();
  
              var videoItem = {
                index: i,
                title: undefined,
                url: undefined
              }
  
              videoList.push(videoItem);
  
              videoQueries.push(
                getYouTubeVideo(`${responseJson.toptracks.track[i].artist.name} ${responseJson.toptracks.track[i].name}`)
                   .then(response => {
                    if (response.ok) {
                      return response.json();
                    }
                    throw new Error(response.statusText);
                    
                  })              
                )
            }
            //promise to make sure videos fetched and displayed in the corrct order
            return Promise.all(videoQueries)
              .then(response => {              
                for (var i = 0; i < videoList.length; i++) {
                  var responseJson = response[i]
                 
                 
                  if (responseJson.items.length == 0) {
                   $results.append(
                     `<li>no video found</li>`
                   )
                   break;
                  }
                  else {
                    $results.append(
                      `<li><a href='https://www.youtube.com/watch?v=${responseJson.items[0].id.videoId}' target='_blank'><h3>${responseJson.items[0].snippet.title}</h3></a>
                      <a href='https://www.youtube.com/watch?v=${responseJson.items[0].id.videoId}' target='_blank'>
                      <img src='${responseJson.items[0].snippet.thumbnails.medium.url}'></a>
                      </li>`
                      
                    );
                  }
                  
                  
                }
                $('#results').removeClass('hidden');
              })
          })
          .catch(err => {
            $('#js-error-message').text(`Something went wrong: ${err.message}`);
          });
  }

  $(watchForm);
  computeHomeButton();

