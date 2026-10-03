import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectorRef, Component, EventEmitter,
  Output, ElementRef, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { Common } from '../../../services/common';
import { Subscription, switchMap, timer } from 'rxjs';
@Component({
  imports: [],
  selector: 'app-play',
  styleUrl: './play.css',
  templateUrl: './play.html',
})
export class Play implements OnInit, OnDestroy {
  isMobile: boolean = false;
  accessChat: boolean = true;
  currentYoutubeUrl: string = '';
  youtubeSubscription!: Subscription;
  youtubePlayer: any = null;
  youtubeApiReady = false;
  isApplyingRemoteState = false;
  lastLocalActionTime = 0;
  youtubeTimeSubscription!: Subscription;
  @ViewChild('youtubePlayerContainer')
  youtubePlayerContainer!: ElementRef;
  currentYoutubeVideoId: string = '';
  @ViewChild('youtubePlayer')
  youtubePlayerElement!: ElementRef;
  youtubePlayerReady = false;
  @Output() currentYoutubeVideoIdChange =
    new EventEmitter<string | null>();
  constructor(private breakpointObserver: BreakpointObserver, public common: Common, private router: Router, private cdr: ChangeDetectorRef) {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  ngOnInit(): void {
    this.loadYoutubeApi();
    this.getYoutubeCurrentPlay()
  }


  loadYoutubeApi() {

    if (
      (window as any).YT &&
      (window as any).YT.Player
    ) {

      console.log('YouTube API already ready');

      this.youtubeApiReady = true;

      return;
    }

    const script = document.createElement('script');

    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;

    document.body.appendChild(script);

    (window as any).onYouTubeIframeAPIReady = () => {

      console.log('YouTube IFrame API ready');

      this.youtubeApiReady = true;

      // Do NOT create player here.
      // getYoutubeCurrentPlay() will do it
      // after the video is known.
    };
  }

 getYoutubeCurrentPlay() {

  // First check immediately
  this.common.getCurrentPlaying().subscribe({

    next: (response: any) => {

      if (
        !response.success ||
        !response.data
      ) {
        return;
      }

      this.handleCurrentYoutubePlay(
        response.data
      );

      // Video exists → start 1 second polling
      this.startYoutubePolling();
    },

    error: (error) => {

      console.error(
        'Current playing error:',
        error
      );

    }

  });
}

startYoutubePolling() {

  if (this.youtubeSubscription) {
    return;
  }

  this.youtubeSubscription = timer(1000, 1000)
    .pipe(
      switchMap(() =>
        this.common.getCurrentPlaying()
      )
    )
    .subscribe({

      next: (response: any) => {

        if (
          !response.success ||
          !response.data
        ) {
          return;
        }

        this.handleCurrentYoutubePlay(
          response.data
        );

      },

      error: (error) => {

        console.error(
          'Current playing error:',
          error
        );

      }

    });
}

handleCurrentYoutubePlay(data: any) {

  const url =
    data.youtubeLinkId?.link;

  if (!url) {
    return;
  }

  const videoId =
    this.extractYoutubeVideoId(url);

  if (!videoId) {
    return;
  }

  // New video
  if (
    videoId !== this.currentYoutubeVideoId
  ) {

    this.handleNewYoutubeVideo(
      videoId,
      url
    );

    return;
  }

  // Same video → check remote play/pause
  this.handleRemotePlayback(data);
}

handleNewYoutubeVideo(
  videoId: string,
  url: string
) {

  console.log(
    'New YouTube video:',
    videoId
  );

  this.currentYoutubeUrl = url;

  this.currentYoutubeVideoId =
    videoId;

  this.currentYoutubeVideoIdChange.emit(
    this.currentYoutubeVideoId
  );

  this.youtubePlayer = null;

  this.youtubePlayerReady = false;

  this.cdr.detectChanges();

  this.waitForYoutubeContainer();
}

handleRemotePlayback(data: any) {

  if (!this.youtubePlayerReady) {
    return;
  }

  const currentUserId =
    String(
      sessionStorage.getItem('userId')
    );

  const updatedBy =
    String(
      data.updatedBy?._id ||
      data.updatedBy ||
      ''
    );

  // Ignore my own update
  if (
    currentUserId === updatedBy
  ) {
    return;
  }

  console.log(
    'REMOTE ACTION:',
    data.isPlaying
      ? 'PLAY'
      : 'PAUSE'
  );

  this.syncRemotePlayback(
    data.isPlaying,
    data.currentTime
  );
}


  testPlay() {

    console.log(
      'TEST PLAY',
      this.youtubePlayer,
      this.youtubePlayerReady
    );

    if (
      this.youtubePlayer &&
      this.youtubePlayerReady &&
      typeof this.youtubePlayer.playVideo === 'function'
    ) {

      console.log('Calling playVideo()');

      this.youtubePlayer.playVideo();
    }
    console.log(
      'TEST PLAY',
      this.youtubePlayer,
      this.youtubePlayerReady
    );
  }


  testPause() {

    console.log(
      'TEST PAUSE',
      this.youtubePlayer,
      this.youtubePlayerReady
    );

    if (
      this.youtubePlayer &&
      this.youtubePlayerReady &&
      typeof this.youtubePlayer.pauseVideo === 'function'
    ) {
      console.log('Calling pauseVideo()');

      this.youtubePlayer.pauseVideo();
    }
  }

 deleteCurrentPlay() {

  this.common.deleteCurrentPlay().subscribe({

    next: (response: any) => {

      this.youtubePlayerReady = false;

      this.currentYoutubeVideoId = '';

      this.currentYoutubeUrl = '';

      this.currentYoutubeVideoIdChange.emit(
        null
      );

      this.youtubeSubscription?.unsubscribe();

      this.youtubeSubscription = undefined as any;

      this.cdr.detectChanges();

    },

    error: (error) => {

      console.error(
        'Delete current play error:',
        error
      );

    }

  });
}

  waitForYoutubeContainer() {

    if (!this.youtubeApiReady) {

      console.log(
        'Waiting for YouTube API...'
      );

      setTimeout(() => {
        this.waitForYoutubeContainer();
      }, 300);

      return;
    }

    if (!this.youtubePlayerElement) {

      console.log(
        'Waiting for YouTube container...'
      );

      setTimeout(() => {
        this.waitForYoutubeContainer();
      }, 300);

      return;
    }

    this.createYoutubePlayer();
  }


  extractYoutubeVideoId(url: string): string | null {

    try {

      const parsedUrl = new URL(url);

      // https://www.youtube.com/watch?v=XXXX
      if (
        parsedUrl.hostname === 'www.youtube.com' ||
        parsedUrl.hostname === 'youtube.com' ||
        parsedUrl.hostname === 'm.youtube.com'
      ) {

        const videoId = parsedUrl.searchParams.get('v');

        if (videoId) {
          return videoId;
        }

        // /shorts/XXXX
        if (parsedUrl.pathname.startsWith('/shorts/')) {
          return parsedUrl.pathname
            .split('/shorts/')[1]
            .split('/')[0];
        }

        // /embed/XXXX
        if (parsedUrl.pathname.startsWith('/embed/')) {
          return parsedUrl.pathname
            .split('/embed/')[1]
            .split('/')[0];
        }
      }

      // https://youtu.be/XXXX
      if (parsedUrl.hostname === 'youtu.be') {
        return parsedUrl.pathname
          .substring(1)
          .split('/')[0];
      }

      return null;

    } catch (error) {

      console.error('YouTube URL parsing error:', error);

      return null;
    }
  }

  createYoutubePlayer() {

    console.log(
      'Creating YouTube player:',
      this.currentYoutubeVideoId
    );

    if (!this.youtubePlayerElement) {
      console.error('YouTube container not found');
      return;
    }

    if (!this.youtubeApiReady) {
      console.error('YouTube API not ready');
      return;
    }

    const YT = (window as any).YT;

    if (!YT || !YT.Player) {
      console.error('YT.Player not available');
      return;
    }

    if (this.youtubePlayer) {
      console.log('Player already exists');
      return;
    }

    this.youtubePlayerReady = false;

    this.youtubePlayer = new YT.Player(
      this.youtubePlayerElement.nativeElement,
      {
        width: '100%',
        height: '200',

        videoId: this.currentYoutubeVideoId,

        playerVars: {
          autoplay: 0,
          controls: 1,
          playsinline: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin
        },

        events: {

          onReady: (event: any) => {

            console.log('YouTube player ready');

            this.youtubePlayer = event.target;

            this.youtubePlayerReady = true;

            console.log(
              'Actual YT Player:',
              this.youtubePlayer
            );
          },

          onStateChange: (event: any) => {

            console.log(
              'YouTube state:',
              event.data
            );

            this.youtubeStateChanged(event);
          },

          onError: (event: any) => {

            console.error(
              'YouTube player error:',
              event.data
            );
          }
        }
      }
    );
  }

  youtubeStateChanged(event: any) {

    if (!this.youtubePlayerReady) {
      return;
    }

    // IMPORTANT:
    // If this change came from the other user,
    // don't send it back to MongoDB again.
    if (this.isApplyingRemoteState) {
      console.log('Ignoring remote state change');
      return;
    }

    const YT = (window as any).YT;

    if (!YT || !YT.PlayerState) {
      return;
    }

    if (
      !this.youtubePlayer ||
      typeof this.youtubePlayer.getCurrentTime !== 'function'
    ) {
      return;
    }

    const currentTime =
      this.youtubePlayer.getCurrentTime();

    console.log(
      'YouTube state changed:',
      event.data,
      'time:',
      currentTime
    );


    // ==========================================
    // LOCAL PLAY
    // ==========================================

    if (
      event.data === YT.PlayerState.PLAYING
    ) {

      console.log('LOCAL PLAY');

      this.lastLocalActionTime = Date.now();

      this.common.updatePlayback({
        isPlaying: true,
        currentTime: currentTime
      }).subscribe({

        next: (response: any) => {

          console.log(
            'Play state saved:',
            response
          );

        },

        error: (error: any) => {

          console.error(
            'Play state error:',
            error
          );

        }

      });

    }


    // ==========================================
    // LOCAL PAUSE
    // ==========================================

    else if (
      event.data === YT.PlayerState.PAUSED
    ) {

      console.log('LOCAL PAUSE');

      this.lastLocalActionTime = Date.now();

      this.common.updatePlayback({
        isPlaying: false,
        currentTime: currentTime
      }).subscribe({

        next: (response: any) => {

          console.log(
            'Pause state saved:',
            response
          );

        },

        error: (error: any) => {

          console.error(
            'Pause state error:',
            error
          );

        }

      });

    }


    // ==========================================
    // VIDEO ENDED
    // ==========================================

    else if (
      event.data === YT.PlayerState.ENDED
    ) {

      console.log('LOCAL ENDED');

      this.lastLocalActionTime = Date.now();

      this.common.updatePlayback({
        isPlaying: false,
        currentTime: 0
      }).subscribe({

        next: (response: any) => {

          console.log(
            'Ended state saved:',
            response
          );

        },

        error: (error: any) => {

          console.error(
            'Ended state error:',
            error
          );

        }

      });

    }

  }


  syncRemotePlayback(
    isPlaying: boolean,
    currentTime: number
  ) {

    const YT = (window as any).YT;

    if (
      !YT ||
      !YT.PlayerState ||
      !this.youtubePlayer ||
      !this.youtubePlayerReady
    ) {
      return;
    }

    const playerState =
      this.youtubePlayer.getPlayerState();

    const playerTime =
      this.youtubePlayer.getCurrentTime();


    // ==========================================
    // REMOTE PAUSE
    // ==========================================

    if (!isPlaying) {

      // Only pause if currently playing
      if (
        playerState === YT.PlayerState.PLAYING
      ) {

        console.log(
          'REMOTE PAUSE:',
          currentTime
        );

        this.isApplyingRemoteState = true;

        this.youtubePlayer.pauseVideo();

        // Don't seek every second
        if (
          Math.abs(playerTime - currentTime) > 2
        ) {

          this.youtubePlayer.seekTo(
            currentTime,
            true
          );

        }

        setTimeout(() => {
          this.isApplyingRemoteState = false;
        }, 500);
      }

      return;
    }


    // ==========================================
    // REMOTE PLAY
    // ==========================================

    if (isPlaying) {

      // Only start playing if currently NOT playing
      if (
        playerState !== YT.PlayerState.PLAYING
      ) {

        console.log(
          'REMOTE PLAY:',
          currentTime
        );

        this.isApplyingRemoteState = true;

        // Set position only when starting remote playback
        if (
          Math.abs(playerTime - currentTime) > 2
        ) {

          this.youtubePlayer.seekTo(
            currentTime,
            true
          );

        }

        this.youtubePlayer.playVideo();

        setTimeout(() => {
          this.isApplyingRemoteState = false;
        }, 700);
      }

      return;
    }

  }


  ngOnDestroy(): void {
    this.youtubeSubscription?.unsubscribe();
    if (this.youtubePlayer) {

      try {
        this.youtubePlayer.destroy();
      } catch (error) {
        console.log(error);
      }
    }
  }
}
