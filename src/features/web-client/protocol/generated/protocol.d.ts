import * as $protobuf from "protobufjs";
import Long = require("long");

export namespace hbb {

    interface IEncodedVideoFrame extends hbb.EncodedVideoFrame.$Properties {
    }

    class EncodedVideoFrame {
        constructor(properties?: hbb.EncodedVideoFrame.$Properties);
        $unknowns?: Uint8Array[];
        data: Uint8Array;
        key: boolean;
        pts: (number|Long);
        static encode(message: hbb.EncodedVideoFrame.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.EncodedVideoFrame & hbb.EncodedVideoFrame.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace EncodedVideoFrame {
        interface $Properties {
            data?: (Uint8Array|null);
            key?: (boolean|null);
            pts?: (number|Long|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.EncodedVideoFrame.$Properties;
    }

    interface IEncodedVideoFrames extends hbb.EncodedVideoFrames.$Properties {
    }

    class EncodedVideoFrames {
        constructor(properties?: hbb.EncodedVideoFrames.$Properties);
        $unknowns?: Uint8Array[];
        frames: hbb.EncodedVideoFrame.$Properties[];
        static encode(message: hbb.EncodedVideoFrames.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.EncodedVideoFrames & hbb.EncodedVideoFrames.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace EncodedVideoFrames {
        interface $Properties {
            frames?: (hbb.EncodedVideoFrame.$Properties[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.EncodedVideoFrames.$Properties;
    }

    interface IRGB extends hbb.RGB.$Properties {
    }

    class RGB {
        constructor(properties?: hbb.RGB.$Properties);
        $unknowns?: Uint8Array[];
        compress: boolean;
        static encode(message: hbb.RGB.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.RGB & hbb.RGB.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace RGB {
        interface $Properties {
            compress?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.RGB.$Properties;
    }

    interface IYUV extends hbb.YUV.$Properties {
    }

    class YUV {
        constructor(properties?: hbb.YUV.$Properties);
        $unknowns?: Uint8Array[];
        compress: boolean;
        stride: number;
        static encode(message: hbb.YUV.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.YUV & hbb.YUV.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace YUV {
        interface $Properties {
            compress?: (boolean|null);
            stride?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.YUV.$Properties;
    }

    enum Chroma {
        I420 = 0,
        I444 = 1
    }

    interface IVideoFrame extends hbb.VideoFrame.$Properties {
    }

    class VideoFrame {
        constructor(properties?: hbb.VideoFrame.$Properties);
        $unknowns?: Uint8Array[];
        vp9s?: (hbb.EncodedVideoFrames.$Properties|null);
        rgb?: (hbb.RGB.$Properties|null);
        yuv?: (hbb.YUV.$Properties|null);
        h264s?: (hbb.EncodedVideoFrames.$Properties|null);
        h265s?: (hbb.EncodedVideoFrames.$Properties|null);
        vp8s?: (hbb.EncodedVideoFrames.$Properties|null);
        av1s?: (hbb.EncodedVideoFrames.$Properties|null);
        display: number;
        union?: ("vp9s"|"rgb"|"yuv"|"h264s"|"h265s"|"vp8s"|"av1s");
        static encode(message: hbb.VideoFrame.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.VideoFrame & hbb.VideoFrame.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace VideoFrame {
        interface $Properties {
            vp9s?: (hbb.EncodedVideoFrames.$Properties|null);
            rgb?: (hbb.RGB.$Properties|null);
            yuv?: (hbb.YUV.$Properties|null);
            h264s?: (hbb.EncodedVideoFrames.$Properties|null);
            h265s?: (hbb.EncodedVideoFrames.$Properties|null);
            vp8s?: (hbb.EncodedVideoFrames.$Properties|null);
            av1s?: (hbb.EncodedVideoFrames.$Properties|null);
            display?: (number|null);
            union?: ("vp9s"|"rgb"|"yuv"|"h264s"|"h265s"|"vp8s"|"av1s");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          vp9s?: hbb.EncodedVideoFrames.$Shape|null;
          rgb?: hbb.RGB.$Shape|null;
          yuv?: hbb.YUV.$Shape|null;
          h264s?: hbb.EncodedVideoFrames.$Shape|null;
          h265s?: hbb.EncodedVideoFrames.$Shape|null;
          vp8s?: hbb.EncodedVideoFrames.$Shape|null;
          av1s?: hbb.EncodedVideoFrames.$Shape|null;
          display?: number|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; vp9s?: null; rgb?: null; yuv?: null; h264s?: null; h265s?: null; vp8s?: null; av1s?: null }|{ union?: "vp9s"; vp9s: hbb.EncodedVideoFrames.$Shape; rgb?: null; yuv?: null; h264s?: null; h265s?: null; vp8s?: null; av1s?: null }|{ union?: "rgb"; vp9s?: null; rgb: hbb.RGB.$Shape; yuv?: null; h264s?: null; h265s?: null; vp8s?: null; av1s?: null }|{ union?: "yuv"; vp9s?: null; rgb?: null; yuv: hbb.YUV.$Shape; h264s?: null; h265s?: null; vp8s?: null; av1s?: null }|{ union?: "h264s"; vp9s?: null; rgb?: null; yuv?: null; h264s: hbb.EncodedVideoFrames.$Shape; h265s?: null; vp8s?: null; av1s?: null }|{ union?: "h265s"; vp9s?: null; rgb?: null; yuv?: null; h264s?: null; h265s: hbb.EncodedVideoFrames.$Shape; vp8s?: null; av1s?: null }|{ union?: "vp8s"; vp9s?: null; rgb?: null; yuv?: null; h264s?: null; h265s?: null; vp8s: hbb.EncodedVideoFrames.$Shape; av1s?: null }|{ union?: "av1s"; vp9s?: null; rgb?: null; yuv?: null; h264s?: null; h265s?: null; vp8s?: null; av1s: hbb.EncodedVideoFrames.$Shape })
        );
    }

    interface IDisplayInfo extends hbb.DisplayInfo.$Properties {
    }

    class DisplayInfo {
        constructor(properties?: hbb.DisplayInfo.$Properties);
        $unknowns?: Uint8Array[];
        x: number;
        y: number;
        width: number;
        height: number;
        name: string;
        online: boolean;
        cursorEmbedded: boolean;
        originalResolution?: (hbb.Resolution.$Properties|null);
        scale: number;
        static encode(message: hbb.DisplayInfo.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.DisplayInfo & hbb.DisplayInfo.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace DisplayInfo {
        interface $Properties {
            x?: (number|null);
            y?: (number|null);
            width?: (number|null);
            height?: (number|null);
            name?: (string|null);
            online?: (boolean|null);
            cursorEmbedded?: (boolean|null);
            originalResolution?: (hbb.Resolution.$Properties|null);
            scale?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.DisplayInfo.$Properties;
    }

    interface IPortForward extends hbb.PortForward.$Properties {
    }

    class PortForward {
        constructor(properties?: hbb.PortForward.$Properties);
        $unknowns?: Uint8Array[];
        host: string;
        port: number;
        multiplex: boolean;
        static encode(message: hbb.PortForward.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PortForward & hbb.PortForward.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PortForward {
        interface $Properties {
            host?: (string|null);
            port?: (number|null);
            multiplex?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PortForward.$Properties;
    }

    interface IFileTransfer extends hbb.FileTransfer.$Properties {
    }

    class FileTransfer {
        constructor(properties?: hbb.FileTransfer.$Properties);
        $unknowns?: Uint8Array[];
        dir: string;
        showHidden: boolean;
        static encode(message: hbb.FileTransfer.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileTransfer & hbb.FileTransfer.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileTransfer {
        interface $Properties {
            dir?: (string|null);
            showHidden?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileTransfer.$Properties;
    }

    interface IViewCamera extends hbb.ViewCamera.$Properties {
    }

    class ViewCamera {
        constructor(properties?: hbb.ViewCamera.$Properties);
        $unknowns?: Uint8Array[];
        static encode(message: hbb.ViewCamera.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ViewCamera & hbb.ViewCamera.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ViewCamera {
        interface $Properties {
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ViewCamera.$Properties;
    }

    interface IOSLogin extends hbb.OSLogin.$Properties {
    }

    class OSLogin {
        constructor(properties?: hbb.OSLogin.$Properties);
        $unknowns?: Uint8Array[];
        username: string;
        password: string;
        static encode(message: hbb.OSLogin.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.OSLogin & hbb.OSLogin.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace OSLogin {
        interface $Properties {
            username?: (string|null);
            password?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.OSLogin.$Properties;
    }

    interface ILoginRequest extends hbb.LoginRequest.$Properties {
    }

    class LoginRequest {
        constructor(properties?: hbb.LoginRequest.$Properties);
        $unknowns?: Uint8Array[];
        username: string;
        password: Uint8Array;
        myId: string;
        myName: string;
        option?: (hbb.OptionMessage.$Properties|null);
        fileTransfer?: (hbb.FileTransfer.$Properties|null);
        portForward?: (hbb.PortForward.$Properties|null);
        viewCamera?: (hbb.ViewCamera.$Properties|null);
        terminal?: (hbb.Terminal.$Properties|null);
        videoAckRequired: boolean;
        sessionId: (number|Long);
        version: string;
        osLogin?: (hbb.OSLogin.$Properties|null);
        myPlatform: string;
        hwid: Uint8Array;
        avatar: string;
        union?: ("fileTransfer"|"portForward"|"viewCamera"|"terminal");
        static encode(message: hbb.LoginRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.LoginRequest & hbb.LoginRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace LoginRequest {
        interface $Properties {
            username?: (string|null);
            password?: (Uint8Array|null);
            myId?: (string|null);
            myName?: (string|null);
            option?: (hbb.OptionMessage.$Properties|null);
            fileTransfer?: (hbb.FileTransfer.$Properties|null);
            portForward?: (hbb.PortForward.$Properties|null);
            viewCamera?: (hbb.ViewCamera.$Properties|null);
            terminal?: (hbb.Terminal.$Properties|null);
            videoAckRequired?: (boolean|null);
            sessionId?: (number|Long|null);
            version?: (string|null);
            osLogin?: (hbb.OSLogin.$Properties|null);
            myPlatform?: (string|null);
            hwid?: (Uint8Array|null);
            avatar?: (string|null);
            union?: ("fileTransfer"|"portForward"|"viewCamera"|"terminal");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          username?: string|null;
          password?: Uint8Array|null;
          myId?: string|null;
          myName?: string|null;
          option?: hbb.OptionMessage.$Shape|null;
          fileTransfer?: hbb.FileTransfer.$Shape|null;
          portForward?: hbb.PortForward.$Shape|null;
          viewCamera?: hbb.ViewCamera.$Shape|null;
          terminal?: hbb.Terminal.$Shape|null;
          videoAckRequired?: boolean|null;
          sessionId?: number|Long|null;
          version?: string|null;
          osLogin?: hbb.OSLogin.$Shape|null;
          myPlatform?: string|null;
          hwid?: Uint8Array|null;
          avatar?: string|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; fileTransfer?: null; portForward?: null; viewCamera?: null; terminal?: null }|{ union?: "fileTransfer"; fileTransfer: hbb.FileTransfer.$Shape; portForward?: null; viewCamera?: null; terminal?: null }|{ union?: "portForward"; fileTransfer?: null; portForward: hbb.PortForward.$Shape; viewCamera?: null; terminal?: null }|{ union?: "viewCamera"; fileTransfer?: null; portForward?: null; viewCamera: hbb.ViewCamera.$Shape; terminal?: null }|{ union?: "terminal"; fileTransfer?: null; portForward?: null; viewCamera?: null; terminal: hbb.Terminal.$Shape })
        );
    }

    interface ITerminal extends hbb.Terminal.$Properties {
    }

    class Terminal {
        constructor(properties?: hbb.Terminal.$Properties);
        $unknowns?: Uint8Array[];
        serviceId: string;
        static encode(message: hbb.Terminal.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.Terminal & hbb.Terminal.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace Terminal {
        interface $Properties {
            serviceId?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.Terminal.$Properties;
    }

    interface IAuth2FA extends hbb.Auth2FA.$Properties {
    }

    class Auth2FA {
        constructor(properties?: hbb.Auth2FA.$Properties);
        $unknowns?: Uint8Array[];
        code: string;
        hwid: Uint8Array;
        static encode(message: hbb.Auth2FA.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.Auth2FA & hbb.Auth2FA.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace Auth2FA {
        interface $Properties {
            code?: (string|null);
            hwid?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.Auth2FA.$Properties;
    }

    interface IChatMessage extends hbb.ChatMessage.$Properties {
    }

    class ChatMessage {
        constructor(properties?: hbb.ChatMessage.$Properties);
        $unknowns?: Uint8Array[];
        text: string;
        static encode(message: hbb.ChatMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ChatMessage & hbb.ChatMessage.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ChatMessage {
        interface $Properties {
            text?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ChatMessage.$Properties;
    }

    interface IFeatures extends hbb.Features.$Properties {
    }

    class Features {
        constructor(properties?: hbb.Features.$Properties);
        $unknowns?: Uint8Array[];
        privacyMode: boolean;
        terminal: boolean;
        portForwardMux: boolean;
        static encode(message: hbb.Features.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.Features & hbb.Features.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace Features {
        interface $Properties {
            privacyMode?: (boolean|null);
            terminal?: (boolean|null);
            portForwardMux?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.Features.$Properties;
    }

    interface ICodecAbility extends hbb.CodecAbility.$Properties {
    }

    class CodecAbility {
        constructor(properties?: hbb.CodecAbility.$Properties);
        $unknowns?: Uint8Array[];
        vp8: boolean;
        vp9: boolean;
        av1: boolean;
        h264: boolean;
        h265: boolean;
        static encode(message: hbb.CodecAbility.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CodecAbility & hbb.CodecAbility.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CodecAbility {
        interface $Properties {
            vp8?: (boolean|null);
            vp9?: (boolean|null);
            av1?: (boolean|null);
            h264?: (boolean|null);
            h265?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CodecAbility.$Properties;
    }

    interface ISupportedEncoding extends hbb.SupportedEncoding.$Properties {
    }

    class SupportedEncoding {
        constructor(properties?: hbb.SupportedEncoding.$Properties);
        $unknowns?: Uint8Array[];
        h264: boolean;
        h265: boolean;
        vp8: boolean;
        av1: boolean;
        i444?: (hbb.CodecAbility.$Properties|null);
        static encode(message: hbb.SupportedEncoding.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.SupportedEncoding & hbb.SupportedEncoding.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace SupportedEncoding {
        interface $Properties {
            h264?: (boolean|null);
            h265?: (boolean|null);
            vp8?: (boolean|null);
            av1?: (boolean|null);
            i444?: (hbb.CodecAbility.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.SupportedEncoding.$Properties;
    }

    interface IPeerInfo extends hbb.PeerInfo.$Properties {
    }

    class PeerInfo {
        constructor(properties?: hbb.PeerInfo.$Properties);
        $unknowns?: Uint8Array[];
        username: string;
        hostname: string;
        platform: string;
        displays: hbb.DisplayInfo.$Properties[];
        currentDisplay: number;
        sasEnabled: boolean;
        version: string;
        features?: (hbb.Features.$Properties|null);
        encoding?: (hbb.SupportedEncoding.$Properties|null);
        resolutions?: (hbb.SupportedResolutions.$Properties|null);
        platformAdditions: string;
        windowsSessions?: (hbb.WindowsSessions.$Properties|null);
        static encode(message: hbb.PeerInfo.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PeerInfo & hbb.PeerInfo.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PeerInfo {
        interface $Properties {
            username?: (string|null);
            hostname?: (string|null);
            platform?: (string|null);
            displays?: (hbb.DisplayInfo.$Properties[]|null);
            currentDisplay?: (number|null);
            sasEnabled?: (boolean|null);
            version?: (string|null);
            features?: (hbb.Features.$Properties|null);
            encoding?: (hbb.SupportedEncoding.$Properties|null);
            resolutions?: (hbb.SupportedResolutions.$Properties|null);
            platformAdditions?: (string|null);
            windowsSessions?: (hbb.WindowsSessions.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PeerInfo.$Properties;
    }

    interface IWindowsSession extends hbb.WindowsSession.$Properties {
    }

    class WindowsSession {
        constructor(properties?: hbb.WindowsSession.$Properties);
        $unknowns?: Uint8Array[];
        sid: number;
        name: string;
        static encode(message: hbb.WindowsSession.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.WindowsSession & hbb.WindowsSession.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace WindowsSession {
        interface $Properties {
            sid?: (number|null);
            name?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.WindowsSession.$Properties;
    }

    interface ILoginResponse extends hbb.LoginResponse.$Properties {
    }

    class LoginResponse {
        constructor(properties?: hbb.LoginResponse.$Properties);
        $unknowns?: Uint8Array[];
        error?: (string|null);
        peerInfo?: (hbb.PeerInfo.$Properties|null);
        enableTrustedDevices: boolean;
        union?: ("error"|"peerInfo");
        static encode(message: hbb.LoginResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.LoginResponse & hbb.LoginResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace LoginResponse {
        interface $Properties {
            error?: (string|null);
            peerInfo?: (hbb.PeerInfo.$Properties|null);
            enableTrustedDevices?: (boolean|null);
            union?: ("error"|"peerInfo");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          error?: string|null;
          peerInfo?: hbb.PeerInfo.$Shape|null;
          enableTrustedDevices?: boolean|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; error?: null; peerInfo?: null }|{ union?: "error"; error: string; peerInfo?: null }|{ union?: "peerInfo"; error?: null; peerInfo: hbb.PeerInfo.$Shape })
        );
    }

    interface ITouchScaleUpdate extends hbb.TouchScaleUpdate.$Properties {
    }

    class TouchScaleUpdate {
        constructor(properties?: hbb.TouchScaleUpdate.$Properties);
        $unknowns?: Uint8Array[];
        scale: number;
        static encode(message: hbb.TouchScaleUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TouchScaleUpdate & hbb.TouchScaleUpdate.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TouchScaleUpdate {
        interface $Properties {
            scale?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TouchScaleUpdate.$Properties;
    }

    interface ITouchPanStart extends hbb.TouchPanStart.$Properties {
    }

    class TouchPanStart {
        constructor(properties?: hbb.TouchPanStart.$Properties);
        $unknowns?: Uint8Array[];
        x: number;
        y: number;
        static encode(message: hbb.TouchPanStart.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TouchPanStart & hbb.TouchPanStart.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TouchPanStart {
        interface $Properties {
            x?: (number|null);
            y?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TouchPanStart.$Properties;
    }

    interface ITouchPanUpdate extends hbb.TouchPanUpdate.$Properties {
    }

    class TouchPanUpdate {
        constructor(properties?: hbb.TouchPanUpdate.$Properties);
        $unknowns?: Uint8Array[];
        x: number;
        y: number;
        static encode(message: hbb.TouchPanUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TouchPanUpdate & hbb.TouchPanUpdate.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TouchPanUpdate {
        interface $Properties {
            x?: (number|null);
            y?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TouchPanUpdate.$Properties;
    }

    interface ITouchPanEnd extends hbb.TouchPanEnd.$Properties {
    }

    class TouchPanEnd {
        constructor(properties?: hbb.TouchPanEnd.$Properties);
        $unknowns?: Uint8Array[];
        x: number;
        y: number;
        static encode(message: hbb.TouchPanEnd.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TouchPanEnd & hbb.TouchPanEnd.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TouchPanEnd {
        interface $Properties {
            x?: (number|null);
            y?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TouchPanEnd.$Properties;
    }

    interface ITouchEvent extends hbb.TouchEvent.$Properties {
    }

    class TouchEvent {
        constructor(properties?: hbb.TouchEvent.$Properties);
        $unknowns?: Uint8Array[];
        scaleUpdate?: (hbb.TouchScaleUpdate.$Properties|null);
        panStart?: (hbb.TouchPanStart.$Properties|null);
        panUpdate?: (hbb.TouchPanUpdate.$Properties|null);
        panEnd?: (hbb.TouchPanEnd.$Properties|null);
        union?: ("scaleUpdate"|"panStart"|"panUpdate"|"panEnd");
        static encode(message: hbb.TouchEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TouchEvent & hbb.TouchEvent.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TouchEvent {
        interface $Properties {
            scaleUpdate?: (hbb.TouchScaleUpdate.$Properties|null);
            panStart?: (hbb.TouchPanStart.$Properties|null);
            panUpdate?: (hbb.TouchPanUpdate.$Properties|null);
            panEnd?: (hbb.TouchPanEnd.$Properties|null);
            union?: ("scaleUpdate"|"panStart"|"panUpdate"|"panEnd");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          scaleUpdate?: hbb.TouchScaleUpdate.$Shape|null;
          panStart?: hbb.TouchPanStart.$Shape|null;
          panUpdate?: hbb.TouchPanUpdate.$Shape|null;
          panEnd?: hbb.TouchPanEnd.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; scaleUpdate?: null; panStart?: null; panUpdate?: null; panEnd?: null }|{ union?: "scaleUpdate"; scaleUpdate: hbb.TouchScaleUpdate.$Shape; panStart?: null; panUpdate?: null; panEnd?: null }|{ union?: "panStart"; scaleUpdate?: null; panStart: hbb.TouchPanStart.$Shape; panUpdate?: null; panEnd?: null }|{ union?: "panUpdate"; scaleUpdate?: null; panStart?: null; panUpdate: hbb.TouchPanUpdate.$Shape; panEnd?: null }|{ union?: "panEnd"; scaleUpdate?: null; panStart?: null; panUpdate?: null; panEnd: hbb.TouchPanEnd.$Shape })
        );
    }

    interface IPointerDeviceEvent extends hbb.PointerDeviceEvent.$Properties {
    }

    class PointerDeviceEvent {
        constructor(properties?: hbb.PointerDeviceEvent.$Properties);
        $unknowns?: Uint8Array[];
        touchEvent?: (hbb.TouchEvent.$Properties|null);
        modifiers: hbb.ControlKey[];
        union?: "touchEvent";
        static encode(message: hbb.PointerDeviceEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PointerDeviceEvent & hbb.PointerDeviceEvent.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PointerDeviceEvent {
        interface $Properties {
            touchEvent?: (hbb.TouchEvent.$Properties|null);
            modifiers?: (hbb.ControlKey[]|null);
            union?: "touchEvent";
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          touchEvent?: hbb.TouchEvent.$Shape|null;
          modifiers?: hbb.ControlKey[]|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; touchEvent?: null }|{ union?: "touchEvent"; touchEvent: hbb.TouchEvent.$Shape })
        );
    }

    interface IMouseEvent extends hbb.MouseEvent.$Properties {
    }

    class MouseEvent {
        constructor(properties?: hbb.MouseEvent.$Properties);
        $unknowns?: Uint8Array[];
        mask: number;
        x: number;
        y: number;
        modifiers: hbb.ControlKey[];
        static encode(message: hbb.MouseEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.MouseEvent & hbb.MouseEvent.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace MouseEvent {
        interface $Properties {
            mask?: (number|null);
            x?: (number|null);
            y?: (number|null);
            modifiers?: (hbb.ControlKey[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.MouseEvent.$Properties;
    }

    enum KeyboardMode {
        Legacy = 0,
        Map = 1,
        Translate = 2,
        Auto = 3
    }

    enum ControlKey {
        Unknown = 0,
        Alt = 1,
        Backspace = 2,
        CapsLock = 3,
        Control = 4,
        Delete = 5,
        DownArrow = 6,
        End = 7,
        Escape = 8,
        F1 = 9,
        F10 = 10,
        F11 = 11,
        F12 = 12,
        F2 = 13,
        F3 = 14,
        F4 = 15,
        F5 = 16,
        F6 = 17,
        F7 = 18,
        F8 = 19,
        F9 = 20,
        Home = 21,
        LeftArrow = 22,
        Meta = 23,
        Option = 24,
        PageDown = 25,
        PageUp = 26,
        Return = 27,
        RightArrow = 28,
        Shift = 29,
        Space = 30,
        Tab = 31,
        UpArrow = 32,
        Numpad0 = 33,
        Numpad1 = 34,
        Numpad2 = 35,
        Numpad3 = 36,
        Numpad4 = 37,
        Numpad5 = 38,
        Numpad6 = 39,
        Numpad7 = 40,
        Numpad8 = 41,
        Numpad9 = 42,
        Cancel = 43,
        Clear = 44,
        Menu = 45,
        Pause = 46,
        Kana = 47,
        Hangul = 48,
        Junja = 49,
        Final = 50,
        Hanja = 51,
        Kanji = 52,
        Convert = 53,
        Select = 54,
        Print = 55,
        Execute = 56,
        Snapshot = 57,
        Insert = 58,
        Help = 59,
        Sleep = 60,
        Separator = 61,
        Scroll = 62,
        NumLock = 63,
        RWin = 64,
        Apps = 65,
        Multiply = 66,
        Add = 67,
        Subtract = 68,
        Decimal = 69,
        Divide = 70,
        Equals = 71,
        NumpadEnter = 72,
        RShift = 73,
        RControl = 74,
        RAlt = 75,
        VolumeMute = 76,
        VolumeUp = 77,
        VolumeDown = 78,
        Power = 79,
        CtrlAltDel = 100,
        LockScreen = 101
    }

    interface IKeyEvent extends hbb.KeyEvent.$Properties {
    }

    class KeyEvent {
        constructor(properties?: hbb.KeyEvent.$Properties);
        $unknowns?: Uint8Array[];
        down: boolean;
        press: boolean;
        controlKey?: (hbb.ControlKey|null);
        chr?: (number|null);
        unicode?: (number|null);
        seq?: (string|null);
        win2winHotkey?: (number|null);
        modifiers: hbb.ControlKey[];
        mode: hbb.KeyboardMode;
        union?: ("controlKey"|"chr"|"unicode"|"seq"|"win2winHotkey");
        static encode(message: hbb.KeyEvent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.KeyEvent & hbb.KeyEvent.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace KeyEvent {
        interface $Properties {
            down?: (boolean|null);
            press?: (boolean|null);
            controlKey?: (hbb.ControlKey|null);
            chr?: (number|null);
            unicode?: (number|null);
            seq?: (string|null);
            win2winHotkey?: (number|null);
            modifiers?: (hbb.ControlKey[]|null);
            mode?: (hbb.KeyboardMode|null);
            union?: ("controlKey"|"chr"|"unicode"|"seq"|"win2winHotkey");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          down?: boolean|null;
          press?: boolean|null;
          controlKey?: hbb.ControlKey|null;
          chr?: number|null;
          unicode?: number|null;
          seq?: string|null;
          win2winHotkey?: number|null;
          modifiers?: hbb.ControlKey[]|null;
          mode?: hbb.KeyboardMode|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; controlKey?: null; chr?: null; unicode?: null; seq?: null; win2winHotkey?: null }|{ union?: "controlKey"; controlKey: hbb.ControlKey; chr?: null; unicode?: null; seq?: null; win2winHotkey?: null }|{ union?: "chr"; controlKey?: null; chr: number; unicode?: null; seq?: null; win2winHotkey?: null }|{ union?: "unicode"; controlKey?: null; chr?: null; unicode: number; seq?: null; win2winHotkey?: null }|{ union?: "seq"; controlKey?: null; chr?: null; unicode?: null; seq: string; win2winHotkey?: null }|{ union?: "win2winHotkey"; controlKey?: null; chr?: null; unicode?: null; seq?: null; win2winHotkey: number })
        );
    }

    interface ICursorData extends hbb.CursorData.$Properties {
    }

    class CursorData {
        constructor(properties?: hbb.CursorData.$Properties);
        $unknowns?: Uint8Array[];
        id: (number|Long);
        hotx: number;
        hoty: number;
        width: number;
        height: number;
        colors: Uint8Array;
        static encode(message: hbb.CursorData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CursorData & hbb.CursorData.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CursorData {
        interface $Properties {
            id?: (number|Long|null);
            hotx?: (number|null);
            hoty?: (number|null);
            width?: (number|null);
            height?: (number|null);
            colors?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CursorData.$Properties;
    }

    interface ICursorPosition extends hbb.CursorPosition.$Properties {
    }

    class CursorPosition {
        constructor(properties?: hbb.CursorPosition.$Properties);
        $unknowns?: Uint8Array[];
        x: number;
        y: number;
        static encode(message: hbb.CursorPosition.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CursorPosition & hbb.CursorPosition.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CursorPosition {
        interface $Properties {
            x?: (number|null);
            y?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CursorPosition.$Properties;
    }

    interface IHash extends hbb.Hash.$Properties {
    }

    class Hash {
        constructor(properties?: hbb.Hash.$Properties);
        $unknowns?: Uint8Array[];
        salt: string;
        challenge: string;
        static encode(message: hbb.Hash.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.Hash & hbb.Hash.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace Hash {
        interface $Properties {
            salt?: (string|null);
            challenge?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.Hash.$Properties;
    }

    enum ClipboardFormat {
        Text = 0,
        Rtf = 1,
        Html = 2,
        ImageRgba = 21,
        ImagePng = 22,
        ImageSvg = 23,
        Special = 31
    }

    interface IClipboard extends hbb.Clipboard.$Properties {
    }

    class Clipboard {
        constructor(properties?: hbb.Clipboard.$Properties);
        $unknowns?: Uint8Array[];
        compress: boolean;
        content: Uint8Array;
        width: number;
        height: number;
        format: hbb.ClipboardFormat;
        specialName: string;
        static encode(message: hbb.Clipboard.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.Clipboard & hbb.Clipboard.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace Clipboard {
        interface $Properties {
            compress?: (boolean|null);
            content?: (Uint8Array|null);
            width?: (number|null);
            height?: (number|null);
            format?: (hbb.ClipboardFormat|null);
            specialName?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.Clipboard.$Properties;
    }

    interface IMultiClipboards extends hbb.MultiClipboards.$Properties {
    }

    class MultiClipboards {
        constructor(properties?: hbb.MultiClipboards.$Properties);
        $unknowns?: Uint8Array[];
        clipboards: hbb.Clipboard.$Properties[];
        static encode(message: hbb.MultiClipboards.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.MultiClipboards & hbb.MultiClipboards.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace MultiClipboards {
        interface $Properties {
            clipboards?: (hbb.Clipboard.$Properties[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.MultiClipboards.$Properties;
    }

    enum FileType {
        Dir = 0,
        DirLink = 2,
        DirDrive = 3,
        File = 4,
        FileLink = 5
    }

    interface IFileEntry extends hbb.FileEntry.$Properties {
    }

    class FileEntry {
        constructor(properties?: hbb.FileEntry.$Properties);
        $unknowns?: Uint8Array[];
        entryType: hbb.FileType;
        name: string;
        isHidden: boolean;
        size: (number|Long);
        modifiedTime: (number|Long);
        static encode(message: hbb.FileEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileEntry & hbb.FileEntry.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileEntry {
        interface $Properties {
            entryType?: (hbb.FileType|null);
            name?: (string|null);
            isHidden?: (boolean|null);
            size?: (number|Long|null);
            modifiedTime?: (number|Long|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileEntry.$Properties;
    }

    interface IFileDirectory extends hbb.FileDirectory.$Properties {
    }

    class FileDirectory {
        constructor(properties?: hbb.FileDirectory.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        path: string;
        entries: hbb.FileEntry.$Properties[];
        static encode(message: hbb.FileDirectory.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileDirectory & hbb.FileDirectory.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileDirectory {
        interface $Properties {
            id?: (number|null);
            path?: (string|null);
            entries?: (hbb.FileEntry.$Properties[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileDirectory.$Properties;
    }

    interface IReadDir extends hbb.ReadDir.$Properties {
    }

    class ReadDir {
        constructor(properties?: hbb.ReadDir.$Properties);
        $unknowns?: Uint8Array[];
        path: string;
        includeHidden: boolean;
        static encode(message: hbb.ReadDir.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ReadDir & hbb.ReadDir.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ReadDir {
        interface $Properties {
            path?: (string|null);
            includeHidden?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ReadDir.$Properties;
    }

    interface IReadEmptyDirs extends hbb.ReadEmptyDirs.$Properties {
    }

    class ReadEmptyDirs {
        constructor(properties?: hbb.ReadEmptyDirs.$Properties);
        $unknowns?: Uint8Array[];
        path: string;
        includeHidden: boolean;
        static encode(message: hbb.ReadEmptyDirs.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ReadEmptyDirs & hbb.ReadEmptyDirs.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ReadEmptyDirs {
        interface $Properties {
            path?: (string|null);
            includeHidden?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ReadEmptyDirs.$Properties;
    }

    interface IReadEmptyDirsResponse extends hbb.ReadEmptyDirsResponse.$Properties {
    }

    class ReadEmptyDirsResponse {
        constructor(properties?: hbb.ReadEmptyDirsResponse.$Properties);
        $unknowns?: Uint8Array[];
        path: string;
        emptyDirs: hbb.FileDirectory.$Properties[];
        static encode(message: hbb.ReadEmptyDirsResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ReadEmptyDirsResponse & hbb.ReadEmptyDirsResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ReadEmptyDirsResponse {
        interface $Properties {
            path?: (string|null);
            emptyDirs?: (hbb.FileDirectory.$Properties[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ReadEmptyDirsResponse.$Properties;
    }

    interface IReadAllFiles extends hbb.ReadAllFiles.$Properties {
    }

    class ReadAllFiles {
        constructor(properties?: hbb.ReadAllFiles.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        path: string;
        includeHidden: boolean;
        static encode(message: hbb.ReadAllFiles.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ReadAllFiles & hbb.ReadAllFiles.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ReadAllFiles {
        interface $Properties {
            id?: (number|null);
            path?: (string|null);
            includeHidden?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ReadAllFiles.$Properties;
    }

    interface IFileRename extends hbb.FileRename.$Properties {
    }

    class FileRename {
        constructor(properties?: hbb.FileRename.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        path: string;
        newName: string;
        static encode(message: hbb.FileRename.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileRename & hbb.FileRename.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileRename {
        interface $Properties {
            id?: (number|null);
            path?: (string|null);
            newName?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileRename.$Properties;
    }

    interface IFileAction extends hbb.FileAction.$Properties {
    }

    class FileAction {
        constructor(properties?: hbb.FileAction.$Properties);
        $unknowns?: Uint8Array[];
        readDir?: (hbb.ReadDir.$Properties|null);
        send?: (hbb.FileTransferSendRequest.$Properties|null);
        receive?: (hbb.FileTransferReceiveRequest.$Properties|null);
        create?: (hbb.FileDirCreate.$Properties|null);
        removeDir?: (hbb.FileRemoveDir.$Properties|null);
        removeFile?: (hbb.FileRemoveFile.$Properties|null);
        allFiles?: (hbb.ReadAllFiles.$Properties|null);
        cancel?: (hbb.FileTransferCancel.$Properties|null);
        sendConfirm?: (hbb.FileTransferSendConfirmRequest.$Properties|null);
        rename?: (hbb.FileRename.$Properties|null);
        readEmptyDirs?: (hbb.ReadEmptyDirs.$Properties|null);
        union?: ("readDir"|"send"|"receive"|"create"|"removeDir"|"removeFile"|"allFiles"|"cancel"|"sendConfirm"|"rename"|"readEmptyDirs");
        static encode(message: hbb.FileAction.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileAction & hbb.FileAction.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileAction {
        interface $Properties {
            readDir?: (hbb.ReadDir.$Properties|null);
            send?: (hbb.FileTransferSendRequest.$Properties|null);
            receive?: (hbb.FileTransferReceiveRequest.$Properties|null);
            create?: (hbb.FileDirCreate.$Properties|null);
            removeDir?: (hbb.FileRemoveDir.$Properties|null);
            removeFile?: (hbb.FileRemoveFile.$Properties|null);
            allFiles?: (hbb.ReadAllFiles.$Properties|null);
            cancel?: (hbb.FileTransferCancel.$Properties|null);
            sendConfirm?: (hbb.FileTransferSendConfirmRequest.$Properties|null);
            rename?: (hbb.FileRename.$Properties|null);
            readEmptyDirs?: (hbb.ReadEmptyDirs.$Properties|null);
            union?: ("readDir"|"send"|"receive"|"create"|"removeDir"|"removeFile"|"allFiles"|"cancel"|"sendConfirm"|"rename"|"readEmptyDirs");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          readDir?: hbb.ReadDir.$Shape|null;
          send?: hbb.FileTransferSendRequest.$Shape|null;
          receive?: hbb.FileTransferReceiveRequest.$Shape|null;
          create?: hbb.FileDirCreate.$Shape|null;
          removeDir?: hbb.FileRemoveDir.$Shape|null;
          removeFile?: hbb.FileRemoveFile.$Shape|null;
          allFiles?: hbb.ReadAllFiles.$Shape|null;
          cancel?: hbb.FileTransferCancel.$Shape|null;
          sendConfirm?: hbb.FileTransferSendConfirmRequest.$Shape|null;
          rename?: hbb.FileRename.$Shape|null;
          readEmptyDirs?: hbb.ReadEmptyDirs.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; readDir?: null; send?: null; receive?: null; create?: null; removeDir?: null; removeFile?: null; allFiles?: null; cancel?: null; sendConfirm?: null; rename?: null; readEmptyDirs?: null }|{ union?: "readDir"; readDir: hbb.ReadDir.$Shape; send?: null; receive?: null; create?: null; removeDir?: null; removeFile?: null; allFiles?: null; cancel?: null; sendConfirm?: null; rename?: null; readEmptyDirs?: null }|{ union?: "send"; readDir?: null; send: hbb.FileTransferSendRequest.$Shape; receive?: null; create?: null; removeDir?: null; removeFile?: null; allFiles?: null; cancel?: null; sendConfirm?: null; rename?: null; readEmptyDirs?: null }|{ union?: "receive"; readDir?: null; send?: null; receive: hbb.FileTransferReceiveRequest.$Shape; create?: null; removeDir?: null; removeFile?: null; allFiles?: null; cancel?: null; sendConfirm?: null; rename?: null; readEmptyDirs?: null }|{ union?: "create"; readDir?: null; send?: null; receive?: null; create: hbb.FileDirCreate.$Shape; removeDir?: null; removeFile?: null; allFiles?: null; cancel?: null; sendConfirm?: null; rename?: null; readEmptyDirs?: null }|{ union?: "removeDir"; readDir?: null; send?: null; receive?: null; create?: null; removeDir: hbb.FileRemoveDir.$Shape; removeFile?: null; allFiles?: null; cancel?: null; sendConfirm?: null; rename?: null; readEmptyDirs?: null }|{ union?: "removeFile"; readDir?: null; send?: null; receive?: null; create?: null; removeDir?: null; removeFile: hbb.FileRemoveFile.$Shape; allFiles?: null; cancel?: null; sendConfirm?: null; rename?: null; readEmptyDirs?: null }|{ union?: "allFiles"; readDir?: null; send?: null; receive?: null; create?: null; removeDir?: null; removeFile?: null; allFiles: hbb.ReadAllFiles.$Shape; cancel?: null; sendConfirm?: null; rename?: null; readEmptyDirs?: null }|{ union?: "cancel"; readDir?: null; send?: null; receive?: null; create?: null; removeDir?: null; removeFile?: null; allFiles?: null; cancel: hbb.FileTransferCancel.$Shape; sendConfirm?: null; rename?: null; readEmptyDirs?: null }|{ union?: "sendConfirm"; readDir?: null; send?: null; receive?: null; create?: null; removeDir?: null; removeFile?: null; allFiles?: null; cancel?: null; sendConfirm: hbb.FileTransferSendConfirmRequest.$Shape; rename?: null; readEmptyDirs?: null }|{ union?: "rename"; readDir?: null; send?: null; receive?: null; create?: null; removeDir?: null; removeFile?: null; allFiles?: null; cancel?: null; sendConfirm?: null; rename: hbb.FileRename.$Shape; readEmptyDirs?: null }|{ union?: "readEmptyDirs"; readDir?: null; send?: null; receive?: null; create?: null; removeDir?: null; removeFile?: null; allFiles?: null; cancel?: null; sendConfirm?: null; rename?: null; readEmptyDirs: hbb.ReadEmptyDirs.$Shape })
        );
    }

    interface IFileTransferCancel extends hbb.FileTransferCancel.$Properties {
    }

    class FileTransferCancel {
        constructor(properties?: hbb.FileTransferCancel.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        static encode(message: hbb.FileTransferCancel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileTransferCancel & hbb.FileTransferCancel.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileTransferCancel {
        interface $Properties {
            id?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileTransferCancel.$Properties;
    }

    interface IFileResponse extends hbb.FileResponse.$Properties {
    }

    class FileResponse {
        constructor(properties?: hbb.FileResponse.$Properties);
        $unknowns?: Uint8Array[];
        dir?: (hbb.FileDirectory.$Properties|null);
        block?: (hbb.FileTransferBlock.$Properties|null);
        error?: (hbb.FileTransferError.$Properties|null);
        done?: (hbb.FileTransferDone.$Properties|null);
        digest?: (hbb.FileTransferDigest.$Properties|null);
        emptyDirs?: (hbb.ReadEmptyDirsResponse.$Properties|null);
        union?: ("dir"|"block"|"error"|"done"|"digest"|"emptyDirs");
        static encode(message: hbb.FileResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileResponse & hbb.FileResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileResponse {
        interface $Properties {
            dir?: (hbb.FileDirectory.$Properties|null);
            block?: (hbb.FileTransferBlock.$Properties|null);
            error?: (hbb.FileTransferError.$Properties|null);
            done?: (hbb.FileTransferDone.$Properties|null);
            digest?: (hbb.FileTransferDigest.$Properties|null);
            emptyDirs?: (hbb.ReadEmptyDirsResponse.$Properties|null);
            union?: ("dir"|"block"|"error"|"done"|"digest"|"emptyDirs");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          dir?: hbb.FileDirectory.$Shape|null;
          block?: hbb.FileTransferBlock.$Shape|null;
          error?: hbb.FileTransferError.$Shape|null;
          done?: hbb.FileTransferDone.$Shape|null;
          digest?: hbb.FileTransferDigest.$Shape|null;
          emptyDirs?: hbb.ReadEmptyDirsResponse.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; dir?: null; block?: null; error?: null; done?: null; digest?: null; emptyDirs?: null }|{ union?: "dir"; dir: hbb.FileDirectory.$Shape; block?: null; error?: null; done?: null; digest?: null; emptyDirs?: null }|{ union?: "block"; dir?: null; block: hbb.FileTransferBlock.$Shape; error?: null; done?: null; digest?: null; emptyDirs?: null }|{ union?: "error"; dir?: null; block?: null; error: hbb.FileTransferError.$Shape; done?: null; digest?: null; emptyDirs?: null }|{ union?: "done"; dir?: null; block?: null; error?: null; done: hbb.FileTransferDone.$Shape; digest?: null; emptyDirs?: null }|{ union?: "digest"; dir?: null; block?: null; error?: null; done?: null; digest: hbb.FileTransferDigest.$Shape; emptyDirs?: null }|{ union?: "emptyDirs"; dir?: null; block?: null; error?: null; done?: null; digest?: null; emptyDirs: hbb.ReadEmptyDirsResponse.$Shape })
        );
    }

    interface IFileTransferDigest extends hbb.FileTransferDigest.$Properties {
    }

    class FileTransferDigest {
        constructor(properties?: hbb.FileTransferDigest.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        fileNum: number;
        lastModified: (number|Long);
        fileSize: (number|Long);
        isUpload: boolean;
        isIdentical: boolean;
        transferredSize: (number|Long);
        isResume: boolean;
        static encode(message: hbb.FileTransferDigest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileTransferDigest & hbb.FileTransferDigest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileTransferDigest {
        interface $Properties {
            id?: (number|null);
            fileNum?: (number|null);
            lastModified?: (number|Long|null);
            fileSize?: (number|Long|null);
            isUpload?: (boolean|null);
            isIdentical?: (boolean|null);
            transferredSize?: (number|Long|null);
            isResume?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileTransferDigest.$Properties;
    }

    interface IFileTransferBlock extends hbb.FileTransferBlock.$Properties {
    }

    class FileTransferBlock {
        constructor(properties?: hbb.FileTransferBlock.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        fileNum: number;
        data: Uint8Array;
        compressed: boolean;
        blkId: number;
        static encode(message: hbb.FileTransferBlock.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileTransferBlock & hbb.FileTransferBlock.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileTransferBlock {
        interface $Properties {
            id?: (number|null);
            fileNum?: (number|null);
            data?: (Uint8Array|null);
            compressed?: (boolean|null);
            blkId?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileTransferBlock.$Properties;
    }

    interface IFileTransferError extends hbb.FileTransferError.$Properties {
    }

    class FileTransferError {
        constructor(properties?: hbb.FileTransferError.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        error: string;
        fileNum: number;
        static encode(message: hbb.FileTransferError.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileTransferError & hbb.FileTransferError.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileTransferError {
        interface $Properties {
            id?: (number|null);
            error?: (string|null);
            fileNum?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileTransferError.$Properties;
    }

    interface IFileTransferSendRequest extends hbb.FileTransferSendRequest.$Properties {
    }

    class FileTransferSendRequest {
        constructor(properties?: hbb.FileTransferSendRequest.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        path: string;
        includeHidden: boolean;
        fileNum: number;
        fileType: hbb.FileTransferSendRequest.FileType;
        static encode(message: hbb.FileTransferSendRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileTransferSendRequest & hbb.FileTransferSendRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileTransferSendRequest {
        interface $Properties {
            id?: (number|null);
            path?: (string|null);
            includeHidden?: (boolean|null);
            fileNum?: (number|null);
            fileType?: (hbb.FileTransferSendRequest.FileType|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileTransferSendRequest.$Properties;

        enum FileType {
            Generic = 0,
            Printer = 1
        }
    }

    interface IFileTransferSendConfirmRequest extends hbb.FileTransferSendConfirmRequest.$Properties {
    }

    class FileTransferSendConfirmRequest {
        constructor(properties?: hbb.FileTransferSendConfirmRequest.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        fileNum: number;
        skip?: (boolean|null);
        offsetBlk?: (number|null);
        union?: ("skip"|"offsetBlk");
        static encode(message: hbb.FileTransferSendConfirmRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileTransferSendConfirmRequest & hbb.FileTransferSendConfirmRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileTransferSendConfirmRequest {
        interface $Properties {
            id?: (number|null);
            fileNum?: (number|null);
            skip?: (boolean|null);
            offsetBlk?: (number|null);
            union?: ("skip"|"offsetBlk");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          id?: number|null;
          fileNum?: number|null;
          skip?: boolean|null;
          offsetBlk?: number|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; skip?: null; offsetBlk?: null }|{ union?: "skip"; skip: boolean; offsetBlk?: null }|{ union?: "offsetBlk"; skip?: null; offsetBlk: number })
        );
    }

    interface IFileTransferDone extends hbb.FileTransferDone.$Properties {
    }

    class FileTransferDone {
        constructor(properties?: hbb.FileTransferDone.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        fileNum: number;
        static encode(message: hbb.FileTransferDone.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileTransferDone & hbb.FileTransferDone.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileTransferDone {
        interface $Properties {
            id?: (number|null);
            fileNum?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileTransferDone.$Properties;
    }

    interface IFileTransferReceiveRequest extends hbb.FileTransferReceiveRequest.$Properties {
    }

    class FileTransferReceiveRequest {
        constructor(properties?: hbb.FileTransferReceiveRequest.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        path: string;
        files: hbb.FileEntry.$Properties[];
        fileNum: number;
        totalSize: (number|Long);
        static encode(message: hbb.FileTransferReceiveRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileTransferReceiveRequest & hbb.FileTransferReceiveRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileTransferReceiveRequest {
        interface $Properties {
            id?: (number|null);
            path?: (string|null);
            files?: (hbb.FileEntry.$Properties[]|null);
            fileNum?: (number|null);
            totalSize?: (number|Long|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileTransferReceiveRequest.$Properties;
    }

    interface IFileRemoveDir extends hbb.FileRemoveDir.$Properties {
    }

    class FileRemoveDir {
        constructor(properties?: hbb.FileRemoveDir.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        path: string;
        recursive: boolean;
        static encode(message: hbb.FileRemoveDir.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileRemoveDir & hbb.FileRemoveDir.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileRemoveDir {
        interface $Properties {
            id?: (number|null);
            path?: (string|null);
            recursive?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileRemoveDir.$Properties;
    }

    interface IFileRemoveFile extends hbb.FileRemoveFile.$Properties {
    }

    class FileRemoveFile {
        constructor(properties?: hbb.FileRemoveFile.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        path: string;
        fileNum: number;
        static encode(message: hbb.FileRemoveFile.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileRemoveFile & hbb.FileRemoveFile.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileRemoveFile {
        interface $Properties {
            id?: (number|null);
            path?: (string|null);
            fileNum?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileRemoveFile.$Properties;
    }

    interface IFileDirCreate extends hbb.FileDirCreate.$Properties {
    }

    class FileDirCreate {
        constructor(properties?: hbb.FileDirCreate.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        path: string;
        static encode(message: hbb.FileDirCreate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FileDirCreate & hbb.FileDirCreate.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FileDirCreate {
        interface $Properties {
            id?: (number|null);
            path?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FileDirCreate.$Properties;
    }

    interface ICliprdrMonitorReady extends hbb.CliprdrMonitorReady.$Properties {
    }

    class CliprdrMonitorReady {
        constructor(properties?: hbb.CliprdrMonitorReady.$Properties);
        $unknowns?: Uint8Array[];
        static encode(message: hbb.CliprdrMonitorReady.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CliprdrMonitorReady & hbb.CliprdrMonitorReady.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CliprdrMonitorReady {
        interface $Properties {
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CliprdrMonitorReady.$Properties;
    }

    interface ICliprdrFormat extends hbb.CliprdrFormat.$Properties {
    }

    class CliprdrFormat {
        constructor(properties?: hbb.CliprdrFormat.$Properties);
        $unknowns?: Uint8Array[];
        id: number;
        format: string;
        static encode(message: hbb.CliprdrFormat.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CliprdrFormat & hbb.CliprdrFormat.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CliprdrFormat {
        interface $Properties {
            id?: (number|null);
            format?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CliprdrFormat.$Properties;
    }

    interface ICliprdrServerFormatList extends hbb.CliprdrServerFormatList.$Properties {
    }

    class CliprdrServerFormatList {
        constructor(properties?: hbb.CliprdrServerFormatList.$Properties);
        $unknowns?: Uint8Array[];
        formats: hbb.CliprdrFormat.$Properties[];
        static encode(message: hbb.CliprdrServerFormatList.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CliprdrServerFormatList & hbb.CliprdrServerFormatList.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CliprdrServerFormatList {
        interface $Properties {
            formats?: (hbb.CliprdrFormat.$Properties[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CliprdrServerFormatList.$Properties;
    }

    interface ICliprdrServerFormatListResponse extends hbb.CliprdrServerFormatListResponse.$Properties {
    }

    class CliprdrServerFormatListResponse {
        constructor(properties?: hbb.CliprdrServerFormatListResponse.$Properties);
        $unknowns?: Uint8Array[];
        msgFlags: number;
        static encode(message: hbb.CliprdrServerFormatListResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CliprdrServerFormatListResponse & hbb.CliprdrServerFormatListResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CliprdrServerFormatListResponse {
        interface $Properties {
            msgFlags?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CliprdrServerFormatListResponse.$Properties;
    }

    interface ICliprdrServerFormatDataRequest extends hbb.CliprdrServerFormatDataRequest.$Properties {
    }

    class CliprdrServerFormatDataRequest {
        constructor(properties?: hbb.CliprdrServerFormatDataRequest.$Properties);
        $unknowns?: Uint8Array[];
        requestedFormatId: number;
        static encode(message: hbb.CliprdrServerFormatDataRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CliprdrServerFormatDataRequest & hbb.CliprdrServerFormatDataRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CliprdrServerFormatDataRequest {
        interface $Properties {
            requestedFormatId?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CliprdrServerFormatDataRequest.$Properties;
    }

    interface ICliprdrServerFormatDataResponse extends hbb.CliprdrServerFormatDataResponse.$Properties {
    }

    class CliprdrServerFormatDataResponse {
        constructor(properties?: hbb.CliprdrServerFormatDataResponse.$Properties);
        $unknowns?: Uint8Array[];
        msgFlags: number;
        formatData: Uint8Array;
        static encode(message: hbb.CliprdrServerFormatDataResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CliprdrServerFormatDataResponse & hbb.CliprdrServerFormatDataResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CliprdrServerFormatDataResponse {
        interface $Properties {
            msgFlags?: (number|null);
            formatData?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CliprdrServerFormatDataResponse.$Properties;
    }

    interface ICliprdrFileContentsRequest extends hbb.CliprdrFileContentsRequest.$Properties {
    }

    class CliprdrFileContentsRequest {
        constructor(properties?: hbb.CliprdrFileContentsRequest.$Properties);
        $unknowns?: Uint8Array[];
        streamId: number;
        listIndex: number;
        dwFlags: number;
        nPositionLow: number;
        nPositionHigh: number;
        cbRequested: number;
        haveClipDataId: boolean;
        clipDataId: number;
        static encode(message: hbb.CliprdrFileContentsRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CliprdrFileContentsRequest & hbb.CliprdrFileContentsRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CliprdrFileContentsRequest {
        interface $Properties {
            streamId?: (number|null);
            listIndex?: (number|null);
            dwFlags?: (number|null);
            nPositionLow?: (number|null);
            nPositionHigh?: (number|null);
            cbRequested?: (number|null);
            haveClipDataId?: (boolean|null);
            clipDataId?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CliprdrFileContentsRequest.$Properties;
    }

    interface ICliprdrFileContentsResponse extends hbb.CliprdrFileContentsResponse.$Properties {
    }

    class CliprdrFileContentsResponse {
        constructor(properties?: hbb.CliprdrFileContentsResponse.$Properties);
        $unknowns?: Uint8Array[];
        msgFlags: number;
        streamId: number;
        requestedData: Uint8Array;
        static encode(message: hbb.CliprdrFileContentsResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CliprdrFileContentsResponse & hbb.CliprdrFileContentsResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CliprdrFileContentsResponse {
        interface $Properties {
            msgFlags?: (number|null);
            streamId?: (number|null);
            requestedData?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CliprdrFileContentsResponse.$Properties;
    }

    interface ICliprdrTryEmpty extends hbb.CliprdrTryEmpty.$Properties {
    }

    class CliprdrTryEmpty {
        constructor(properties?: hbb.CliprdrTryEmpty.$Properties);
        $unknowns?: Uint8Array[];
        static encode(message: hbb.CliprdrTryEmpty.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CliprdrTryEmpty & hbb.CliprdrTryEmpty.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CliprdrTryEmpty {
        interface $Properties {
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CliprdrTryEmpty.$Properties;
    }

    interface ICliprdrFile extends hbb.CliprdrFile.$Properties {
    }

    class CliprdrFile {
        constructor(properties?: hbb.CliprdrFile.$Properties);
        $unknowns?: Uint8Array[];
        name: string;
        size: (number|Long);
        static encode(message: hbb.CliprdrFile.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CliprdrFile & hbb.CliprdrFile.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CliprdrFile {
        interface $Properties {
            name?: (string|null);
            size?: (number|Long|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CliprdrFile.$Properties;
    }

    interface ICliprdrFiles extends hbb.CliprdrFiles.$Properties {
    }

    class CliprdrFiles {
        constructor(properties?: hbb.CliprdrFiles.$Properties);
        $unknowns?: Uint8Array[];
        files: hbb.CliprdrFile.$Properties[];
        static encode(message: hbb.CliprdrFiles.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CliprdrFiles & hbb.CliprdrFiles.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CliprdrFiles {
        interface $Properties {
            files?: (hbb.CliprdrFile.$Properties[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CliprdrFiles.$Properties;
    }

    interface ICliprdr extends hbb.Cliprdr.$Properties {
    }

    class Cliprdr {
        constructor(properties?: hbb.Cliprdr.$Properties);
        $unknowns?: Uint8Array[];
        ready?: (hbb.CliprdrMonitorReady.$Properties|null);
        formatList?: (hbb.CliprdrServerFormatList.$Properties|null);
        formatListResponse?: (hbb.CliprdrServerFormatListResponse.$Properties|null);
        formatDataRequest?: (hbb.CliprdrServerFormatDataRequest.$Properties|null);
        formatDataResponse?: (hbb.CliprdrServerFormatDataResponse.$Properties|null);
        fileContentsRequest?: (hbb.CliprdrFileContentsRequest.$Properties|null);
        fileContentsResponse?: (hbb.CliprdrFileContentsResponse.$Properties|null);
        tryEmpty?: (hbb.CliprdrTryEmpty.$Properties|null);
        files?: (hbb.CliprdrFiles.$Properties|null);
        union?: ("ready"|"formatList"|"formatListResponse"|"formatDataRequest"|"formatDataResponse"|"fileContentsRequest"|"fileContentsResponse"|"tryEmpty"|"files");
        static encode(message: hbb.Cliprdr.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.Cliprdr & hbb.Cliprdr.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace Cliprdr {
        interface $Properties {
            ready?: (hbb.CliprdrMonitorReady.$Properties|null);
            formatList?: (hbb.CliprdrServerFormatList.$Properties|null);
            formatListResponse?: (hbb.CliprdrServerFormatListResponse.$Properties|null);
            formatDataRequest?: (hbb.CliprdrServerFormatDataRequest.$Properties|null);
            formatDataResponse?: (hbb.CliprdrServerFormatDataResponse.$Properties|null);
            fileContentsRequest?: (hbb.CliprdrFileContentsRequest.$Properties|null);
            fileContentsResponse?: (hbb.CliprdrFileContentsResponse.$Properties|null);
            tryEmpty?: (hbb.CliprdrTryEmpty.$Properties|null);
            files?: (hbb.CliprdrFiles.$Properties|null);
            union?: ("ready"|"formatList"|"formatListResponse"|"formatDataRequest"|"formatDataResponse"|"fileContentsRequest"|"fileContentsResponse"|"tryEmpty"|"files");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          ready?: hbb.CliprdrMonitorReady.$Shape|null;
          formatList?: hbb.CliprdrServerFormatList.$Shape|null;
          formatListResponse?: hbb.CliprdrServerFormatListResponse.$Shape|null;
          formatDataRequest?: hbb.CliprdrServerFormatDataRequest.$Shape|null;
          formatDataResponse?: hbb.CliprdrServerFormatDataResponse.$Shape|null;
          fileContentsRequest?: hbb.CliprdrFileContentsRequest.$Shape|null;
          fileContentsResponse?: hbb.CliprdrFileContentsResponse.$Shape|null;
          tryEmpty?: hbb.CliprdrTryEmpty.$Shape|null;
          files?: hbb.CliprdrFiles.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; ready?: null; formatList?: null; formatListResponse?: null; formatDataRequest?: null; formatDataResponse?: null; fileContentsRequest?: null; fileContentsResponse?: null; tryEmpty?: null; files?: null }|{ union?: "ready"; ready: hbb.CliprdrMonitorReady.$Shape; formatList?: null; formatListResponse?: null; formatDataRequest?: null; formatDataResponse?: null; fileContentsRequest?: null; fileContentsResponse?: null; tryEmpty?: null; files?: null }|{ union?: "formatList"; ready?: null; formatList: hbb.CliprdrServerFormatList.$Shape; formatListResponse?: null; formatDataRequest?: null; formatDataResponse?: null; fileContentsRequest?: null; fileContentsResponse?: null; tryEmpty?: null; files?: null }|{ union?: "formatListResponse"; ready?: null; formatList?: null; formatListResponse: hbb.CliprdrServerFormatListResponse.$Shape; formatDataRequest?: null; formatDataResponse?: null; fileContentsRequest?: null; fileContentsResponse?: null; tryEmpty?: null; files?: null }|{ union?: "formatDataRequest"; ready?: null; formatList?: null; formatListResponse?: null; formatDataRequest: hbb.CliprdrServerFormatDataRequest.$Shape; formatDataResponse?: null; fileContentsRequest?: null; fileContentsResponse?: null; tryEmpty?: null; files?: null }|{ union?: "formatDataResponse"; ready?: null; formatList?: null; formatListResponse?: null; formatDataRequest?: null; formatDataResponse: hbb.CliprdrServerFormatDataResponse.$Shape; fileContentsRequest?: null; fileContentsResponse?: null; tryEmpty?: null; files?: null }|{ union?: "fileContentsRequest"; ready?: null; formatList?: null; formatListResponse?: null; formatDataRequest?: null; formatDataResponse?: null; fileContentsRequest: hbb.CliprdrFileContentsRequest.$Shape; fileContentsResponse?: null; tryEmpty?: null; files?: null }|{ union?: "fileContentsResponse"; ready?: null; formatList?: null; formatListResponse?: null; formatDataRequest?: null; formatDataResponse?: null; fileContentsRequest?: null; fileContentsResponse: hbb.CliprdrFileContentsResponse.$Shape; tryEmpty?: null; files?: null }|{ union?: "tryEmpty"; ready?: null; formatList?: null; formatListResponse?: null; formatDataRequest?: null; formatDataResponse?: null; fileContentsRequest?: null; fileContentsResponse?: null; tryEmpty: hbb.CliprdrTryEmpty.$Shape; files?: null }|{ union?: "files"; ready?: null; formatList?: null; formatListResponse?: null; formatDataRequest?: null; formatDataResponse?: null; fileContentsRequest?: null; fileContentsResponse?: null; tryEmpty?: null; files: hbb.CliprdrFiles.$Shape })
        );
    }

    interface IResolution extends hbb.Resolution.$Properties {
    }

    class Resolution {
        constructor(properties?: hbb.Resolution.$Properties);
        $unknowns?: Uint8Array[];
        width: number;
        height: number;
        static encode(message: hbb.Resolution.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.Resolution & hbb.Resolution.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace Resolution {
        interface $Properties {
            width?: (number|null);
            height?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.Resolution.$Properties;
    }

    interface IDisplayResolution extends hbb.DisplayResolution.$Properties {
    }

    class DisplayResolution {
        constructor(properties?: hbb.DisplayResolution.$Properties);
        $unknowns?: Uint8Array[];
        display: number;
        resolution?: (hbb.Resolution.$Properties|null);
        static encode(message: hbb.DisplayResolution.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.DisplayResolution & hbb.DisplayResolution.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace DisplayResolution {
        interface $Properties {
            display?: (number|null);
            resolution?: (hbb.Resolution.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.DisplayResolution.$Properties;
    }

    interface ISupportedResolutions extends hbb.SupportedResolutions.$Properties {
    }

    class SupportedResolutions {
        constructor(properties?: hbb.SupportedResolutions.$Properties);
        $unknowns?: Uint8Array[];
        resolutions: hbb.Resolution.$Properties[];
        static encode(message: hbb.SupportedResolutions.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.SupportedResolutions & hbb.SupportedResolutions.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace SupportedResolutions {
        interface $Properties {
            resolutions?: (hbb.Resolution.$Properties[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.SupportedResolutions.$Properties;
    }

    interface ISwitchDisplay extends hbb.SwitchDisplay.$Properties {
    }

    class SwitchDisplay {
        constructor(properties?: hbb.SwitchDisplay.$Properties);
        $unknowns?: Uint8Array[];
        display: number;
        x: number;
        y: number;
        width: number;
        height: number;
        cursorEmbedded: boolean;
        resolutions?: (hbb.SupportedResolutions.$Properties|null);
        originalResolution?: (hbb.Resolution.$Properties|null);
        static encode(message: hbb.SwitchDisplay.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.SwitchDisplay & hbb.SwitchDisplay.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace SwitchDisplay {
        interface $Properties {
            display?: (number|null);
            x?: (number|null);
            y?: (number|null);
            width?: (number|null);
            height?: (number|null);
            cursorEmbedded?: (boolean|null);
            resolutions?: (hbb.SupportedResolutions.$Properties|null);
            originalResolution?: (hbb.Resolution.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.SwitchDisplay.$Properties;
    }

    interface ICaptureDisplays extends hbb.CaptureDisplays.$Properties {
    }

    class CaptureDisplays {
        constructor(properties?: hbb.CaptureDisplays.$Properties);
        $unknowns?: Uint8Array[];
        add: number[];
        sub: number[];
        set: number[];
        static encode(message: hbb.CaptureDisplays.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CaptureDisplays & hbb.CaptureDisplays.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CaptureDisplays {
        interface $Properties {
            add?: (number[]|null);
            sub?: (number[]|null);
            set?: (number[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CaptureDisplays.$Properties;
    }

    interface IToggleVirtualDisplay extends hbb.ToggleVirtualDisplay.$Properties {
    }

    class ToggleVirtualDisplay {
        constructor(properties?: hbb.ToggleVirtualDisplay.$Properties);
        $unknowns?: Uint8Array[];
        display: number;
        on: boolean;
        static encode(message: hbb.ToggleVirtualDisplay.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ToggleVirtualDisplay & hbb.ToggleVirtualDisplay.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ToggleVirtualDisplay {
        interface $Properties {
            display?: (number|null);
            on?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ToggleVirtualDisplay.$Properties;
    }

    interface ITogglePrivacyMode extends hbb.TogglePrivacyMode.$Properties {
    }

    class TogglePrivacyMode {
        constructor(properties?: hbb.TogglePrivacyMode.$Properties);
        $unknowns?: Uint8Array[];
        implKey: string;
        on: boolean;
        static encode(message: hbb.TogglePrivacyMode.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TogglePrivacyMode & hbb.TogglePrivacyMode.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TogglePrivacyMode {
        interface $Properties {
            implKey?: (string|null);
            on?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TogglePrivacyMode.$Properties;
    }

    interface IPermissionInfo extends hbb.PermissionInfo.$Properties {
    }

    class PermissionInfo {
        constructor(properties?: hbb.PermissionInfo.$Properties);
        $unknowns?: Uint8Array[];
        permission: hbb.PermissionInfo.Permission;
        enabled: boolean;
        static encode(message: hbb.PermissionInfo.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PermissionInfo & hbb.PermissionInfo.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PermissionInfo {
        interface $Properties {
            permission?: (hbb.PermissionInfo.Permission|null);
            enabled?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PermissionInfo.$Properties;

        enum Permission {
            Keyboard = 0,
            Clipboard = 2,
            Audio = 3,
            File = 4,
            Restart = 5,
            Recording = 6,
            BlockInput = 7,
            PrivacyMode = 8
        }
    }

    enum ImageQuality {
        NotSet = 0,
        Low = 2,
        Balanced = 3,
        Best = 4
    }

    interface ISupportedDecoding extends hbb.SupportedDecoding.$Properties {
    }

    class SupportedDecoding {
        constructor(properties?: hbb.SupportedDecoding.$Properties);
        $unknowns?: Uint8Array[];
        abilityVp9: number;
        abilityH264: number;
        abilityH265: number;
        prefer: hbb.SupportedDecoding.PreferCodec;
        abilityVp8: number;
        abilityAv1: number;
        i444?: (hbb.CodecAbility.$Properties|null);
        preferChroma: hbb.Chroma;
        static encode(message: hbb.SupportedDecoding.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.SupportedDecoding & hbb.SupportedDecoding.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace SupportedDecoding {
        interface $Properties {
            abilityVp9?: (number|null);
            abilityH264?: (number|null);
            abilityH265?: (number|null);
            prefer?: (hbb.SupportedDecoding.PreferCodec|null);
            abilityVp8?: (number|null);
            abilityAv1?: (number|null);
            i444?: (hbb.CodecAbility.$Properties|null);
            preferChroma?: (hbb.Chroma|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.SupportedDecoding.$Properties;

        enum PreferCodec {
            Auto = 0,
            VP9 = 1,
            H264 = 2,
            H265 = 3,
            VP8 = 4,
            AV1 = 5
        }
    }

    interface IOptionMessage extends hbb.OptionMessage.$Properties {
    }

    class OptionMessage {
        constructor(properties?: hbb.OptionMessage.$Properties);
        $unknowns?: Uint8Array[];
        imageQuality: hbb.ImageQuality;
        lockAfterSessionEnd: hbb.OptionMessage.BoolOption;
        showRemoteCursor: hbb.OptionMessage.BoolOption;
        privacyMode: hbb.OptionMessage.BoolOption;
        blockInput: hbb.OptionMessage.BoolOption;
        customImageQuality: number;
        disableAudio: hbb.OptionMessage.BoolOption;
        disableClipboard: hbb.OptionMessage.BoolOption;
        enableFileTransfer: hbb.OptionMessage.BoolOption;
        supportedDecoding?: (hbb.SupportedDecoding.$Properties|null);
        customFps: number;
        disableKeyboard: hbb.OptionMessage.BoolOption;
        followRemoteCursor: hbb.OptionMessage.BoolOption;
        followRemoteWindow: hbb.OptionMessage.BoolOption;
        disableCamera: hbb.OptionMessage.BoolOption;
        terminalPersistent: hbb.OptionMessage.BoolOption;
        showMyCursor: hbb.OptionMessage.BoolOption;
        static encode(message: hbb.OptionMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.OptionMessage & hbb.OptionMessage.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace OptionMessage {
        interface $Properties {
            imageQuality?: (hbb.ImageQuality|null);
            lockAfterSessionEnd?: (hbb.OptionMessage.BoolOption|null);
            showRemoteCursor?: (hbb.OptionMessage.BoolOption|null);
            privacyMode?: (hbb.OptionMessage.BoolOption|null);
            blockInput?: (hbb.OptionMessage.BoolOption|null);
            customImageQuality?: (number|null);
            disableAudio?: (hbb.OptionMessage.BoolOption|null);
            disableClipboard?: (hbb.OptionMessage.BoolOption|null);
            enableFileTransfer?: (hbb.OptionMessage.BoolOption|null);
            supportedDecoding?: (hbb.SupportedDecoding.$Properties|null);
            customFps?: (number|null);
            disableKeyboard?: (hbb.OptionMessage.BoolOption|null);
            followRemoteCursor?: (hbb.OptionMessage.BoolOption|null);
            followRemoteWindow?: (hbb.OptionMessage.BoolOption|null);
            disableCamera?: (hbb.OptionMessage.BoolOption|null);
            terminalPersistent?: (hbb.OptionMessage.BoolOption|null);
            showMyCursor?: (hbb.OptionMessage.BoolOption|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.OptionMessage.$Properties;

        enum BoolOption {
            NotSet = 0,
            No = 1,
            Yes = 2
        }
    }

    interface ITestDelay extends hbb.TestDelay.$Properties {
    }

    class TestDelay {
        constructor(properties?: hbb.TestDelay.$Properties);
        $unknowns?: Uint8Array[];
        time: (number|Long);
        fromClient: boolean;
        lastDelay: number;
        targetBitrate: number;
        static encode(message: hbb.TestDelay.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TestDelay & hbb.TestDelay.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TestDelay {
        interface $Properties {
            time?: (number|Long|null);
            fromClient?: (boolean|null);
            lastDelay?: (number|null);
            targetBitrate?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TestDelay.$Properties;
    }

    interface IPublicKey extends hbb.PublicKey.$Properties {
    }

    class PublicKey {
        constructor(properties?: hbb.PublicKey.$Properties);
        $unknowns?: Uint8Array[];
        asymmetricValue: Uint8Array;
        symmetricValue: Uint8Array;
        kxVersion: number;
        static encode(message: hbb.PublicKey.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PublicKey & hbb.PublicKey.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PublicKey {
        interface $Properties {
            asymmetricValue?: (Uint8Array|null);
            symmetricValue?: (Uint8Array|null);
            kxVersion?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PublicKey.$Properties;
    }

    interface ISignedId extends hbb.SignedId.$Properties {
    }

    class SignedId {
        constructor(properties?: hbb.SignedId.$Properties);
        $unknowns?: Uint8Array[];
        id: Uint8Array;
        static encode(message: hbb.SignedId.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.SignedId & hbb.SignedId.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace SignedId {
        interface $Properties {
            id?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.SignedId.$Properties;
    }

    interface IAudioFormat extends hbb.AudioFormat.$Properties {
    }

    class AudioFormat {
        constructor(properties?: hbb.AudioFormat.$Properties);
        $unknowns?: Uint8Array[];
        sampleRate: number;
        channels: number;
        static encode(message: hbb.AudioFormat.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.AudioFormat & hbb.AudioFormat.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace AudioFormat {
        interface $Properties {
            sampleRate?: (number|null);
            channels?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.AudioFormat.$Properties;
    }

    interface IAudioFrame extends hbb.AudioFrame.$Properties {
    }

    class AudioFrame {
        constructor(properties?: hbb.AudioFrame.$Properties);
        $unknowns?: Uint8Array[];
        data: Uint8Array;
        static encode(message: hbb.AudioFrame.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.AudioFrame & hbb.AudioFrame.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace AudioFrame {
        interface $Properties {
            data?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.AudioFrame.$Properties;
    }

    interface IMessageBox extends hbb.MessageBox.$Properties {
    }

    class MessageBox {
        constructor(properties?: hbb.MessageBox.$Properties);
        $unknowns?: Uint8Array[];
        msgtype: string;
        title: string;
        text: string;
        link: string;
        static encode(message: hbb.MessageBox.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.MessageBox & hbb.MessageBox.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace MessageBox {
        interface $Properties {
            msgtype?: (string|null);
            title?: (string|null);
            text?: (string|null);
            link?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.MessageBox.$Properties;
    }

    interface IBackNotification extends hbb.BackNotification.$Properties {
    }

    class BackNotification {
        constructor(properties?: hbb.BackNotification.$Properties);
        $unknowns?: Uint8Array[];
        privacyModeState?: (hbb.BackNotification.PrivacyModeState|null);
        blockInputState?: (hbb.BackNotification.BlockInputState|null);
        details: string;
        implKey: string;
        union?: ("privacyModeState"|"blockInputState");
        static encode(message: hbb.BackNotification.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.BackNotification & hbb.BackNotification.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace BackNotification {
        interface $Properties {
            privacyModeState?: (hbb.BackNotification.PrivacyModeState|null);
            blockInputState?: (hbb.BackNotification.BlockInputState|null);
            details?: (string|null);
            implKey?: (string|null);
            union?: ("privacyModeState"|"blockInputState");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          privacyModeState?: hbb.BackNotification.PrivacyModeState|null;
          blockInputState?: hbb.BackNotification.BlockInputState|null;
          details?: string|null;
          implKey?: string|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; privacyModeState?: null; blockInputState?: null }|{ union?: "privacyModeState"; privacyModeState: hbb.BackNotification.PrivacyModeState; blockInputState?: null }|{ union?: "blockInputState"; privacyModeState?: null; blockInputState: hbb.BackNotification.BlockInputState })
        );

        enum BlockInputState {
            BlkStateUnknown = 0,
            BlkOnSucceeded = 2,
            BlkOnFailed = 3,
            BlkOffSucceeded = 4,
            BlkOffFailed = 5
        }

        enum PrivacyModeState {
            PrvStateUnknown = 0,
            PrvOnByOther = 2,
            PrvNotSupported = 3,
            PrvOnSucceeded = 4,
            PrvOnFailedDenied = 5,
            PrvOnFailedPlugin = 6,
            PrvOnFailed = 7,
            PrvOffSucceeded = 8,
            PrvOffByPeer = 9,
            PrvOffFailed = 10,
            PrvOffUnknown = 11
        }
    }

    interface IElevationRequestWithLogon extends hbb.ElevationRequestWithLogon.$Properties {
    }

    class ElevationRequestWithLogon {
        constructor(properties?: hbb.ElevationRequestWithLogon.$Properties);
        $unknowns?: Uint8Array[];
        username: string;
        password: string;
        static encode(message: hbb.ElevationRequestWithLogon.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ElevationRequestWithLogon & hbb.ElevationRequestWithLogon.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ElevationRequestWithLogon {
        interface $Properties {
            username?: (string|null);
            password?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ElevationRequestWithLogon.$Properties;
    }

    interface IElevationRequest extends hbb.ElevationRequest.$Properties {
    }

    class ElevationRequest {
        constructor(properties?: hbb.ElevationRequest.$Properties);
        $unknowns?: Uint8Array[];
        direct?: (boolean|null);
        logon?: (hbb.ElevationRequestWithLogon.$Properties|null);
        union?: ("direct"|"logon");
        static encode(message: hbb.ElevationRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ElevationRequest & hbb.ElevationRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ElevationRequest {
        interface $Properties {
            direct?: (boolean|null);
            logon?: (hbb.ElevationRequestWithLogon.$Properties|null);
            union?: ("direct"|"logon");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          direct?: boolean|null;
          logon?: hbb.ElevationRequestWithLogon.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; direct?: null; logon?: null }|{ union?: "direct"; direct: boolean; logon?: null }|{ union?: "logon"; direct?: null; logon: hbb.ElevationRequestWithLogon.$Shape })
        );
    }

    interface ISwitchSidesRequest extends hbb.SwitchSidesRequest.$Properties {
    }

    class SwitchSidesRequest {
        constructor(properties?: hbb.SwitchSidesRequest.$Properties);
        $unknowns?: Uint8Array[];
        uuid: Uint8Array;
        static encode(message: hbb.SwitchSidesRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.SwitchSidesRequest & hbb.SwitchSidesRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace SwitchSidesRequest {
        interface $Properties {
            uuid?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.SwitchSidesRequest.$Properties;
    }

    interface ISwitchSidesResponse extends hbb.SwitchSidesResponse.$Properties {
    }

    class SwitchSidesResponse {
        constructor(properties?: hbb.SwitchSidesResponse.$Properties);
        $unknowns?: Uint8Array[];
        uuid: Uint8Array;
        lr?: (hbb.LoginRequest.$Properties|null);
        static encode(message: hbb.SwitchSidesResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.SwitchSidesResponse & hbb.SwitchSidesResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace SwitchSidesResponse {
        interface $Properties {
            uuid?: (Uint8Array|null);
            lr?: (hbb.LoginRequest.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          uuid?: Uint8Array|null;
          lr?: hbb.LoginRequest.$Shape|null;
          $unknowns?: Uint8Array[];
        };
    }

    interface ISwitchBack extends hbb.SwitchBack.$Properties {
    }

    class SwitchBack {
        constructor(properties?: hbb.SwitchBack.$Properties);
        $unknowns?: Uint8Array[];
        static encode(message: hbb.SwitchBack.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.SwitchBack & hbb.SwitchBack.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace SwitchBack {
        interface $Properties {
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.SwitchBack.$Properties;
    }

    interface IPluginRequest extends hbb.PluginRequest.$Properties {
    }

    class PluginRequest {
        constructor(properties?: hbb.PluginRequest.$Properties);
        $unknowns?: Uint8Array[];
        id: string;
        content: Uint8Array;
        static encode(message: hbb.PluginRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PluginRequest & hbb.PluginRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PluginRequest {
        interface $Properties {
            id?: (string|null);
            content?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PluginRequest.$Properties;
    }

    interface IPluginFailure extends hbb.PluginFailure.$Properties {
    }

    class PluginFailure {
        constructor(properties?: hbb.PluginFailure.$Properties);
        $unknowns?: Uint8Array[];
        id: string;
        name: string;
        msg: string;
        static encode(message: hbb.PluginFailure.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PluginFailure & hbb.PluginFailure.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PluginFailure {
        interface $Properties {
            id?: (string|null);
            name?: (string|null);
            msg?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PluginFailure.$Properties;
    }

    interface IWindowsSessions extends hbb.WindowsSessions.$Properties {
    }

    class WindowsSessions {
        constructor(properties?: hbb.WindowsSessions.$Properties);
        $unknowns?: Uint8Array[];
        sessions: hbb.WindowsSession.$Properties[];
        currentSid: number;
        static encode(message: hbb.WindowsSessions.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.WindowsSessions & hbb.WindowsSessions.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace WindowsSessions {
        interface $Properties {
            sessions?: (hbb.WindowsSession.$Properties[]|null);
            currentSid?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.WindowsSessions.$Properties;
    }

    interface IMessageQuery extends hbb.MessageQuery.$Properties {
    }

    class MessageQuery {
        constructor(properties?: hbb.MessageQuery.$Properties);
        $unknowns?: Uint8Array[];
        switchDisplay: number;
        static encode(message: hbb.MessageQuery.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.MessageQuery & hbb.MessageQuery.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace MessageQuery {
        interface $Properties {
            switchDisplay?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.MessageQuery.$Properties;
    }

    interface IMisc extends hbb.Misc.$Properties {
    }

    class Misc {
        constructor(properties?: hbb.Misc.$Properties);
        $unknowns?: Uint8Array[];
        chatMessage?: (hbb.ChatMessage.$Properties|null);
        switchDisplay?: (hbb.SwitchDisplay.$Properties|null);
        permissionInfo?: (hbb.PermissionInfo.$Properties|null);
        option?: (hbb.OptionMessage.$Properties|null);
        audioFormat?: (hbb.AudioFormat.$Properties|null);
        closeReason?: (string|null);
        refreshVideo?: (boolean|null);
        videoReceived?: (boolean|null);
        backNotification?: (hbb.BackNotification.$Properties|null);
        restartRemoteDevice?: (boolean|null);
        uac?: (boolean|null);
        foregroundWindowElevated?: (boolean|null);
        stopService?: (boolean|null);
        elevationRequest?: (hbb.ElevationRequest.$Properties|null);
        elevationResponse?: (string|null);
        portableServiceRunning?: (boolean|null);
        switchSidesRequest?: (hbb.SwitchSidesRequest.$Properties|null);
        switchBack?: (hbb.SwitchBack.$Properties|null);
        changeResolution?: (hbb.Resolution.$Properties|null);
        pluginRequest?: (hbb.PluginRequest.$Properties|null);
        pluginFailure?: (hbb.PluginFailure.$Properties|null);
        fullSpeedFps?: (number|null);
        autoAdjustFps?: (number|null);
        clientRecordStatus?: (boolean|null);
        captureDisplays?: (hbb.CaptureDisplays.$Properties|null);
        refreshVideoDisplay?: (number|null);
        toggleVirtualDisplay?: (hbb.ToggleVirtualDisplay.$Properties|null);
        togglePrivacyMode?: (hbb.TogglePrivacyMode.$Properties|null);
        supportedEncoding?: (hbb.SupportedEncoding.$Properties|null);
        selectedSid?: (number|null);
        changeDisplayResolution?: (hbb.DisplayResolution.$Properties|null);
        messageQuery?: (hbb.MessageQuery.$Properties|null);
        followCurrentDisplay?: (number|null);
        requestCursorData?: (number|Long|null);
        union?: ("chatMessage"|"switchDisplay"|"permissionInfo"|"option"|"audioFormat"|"closeReason"|"refreshVideo"|"videoReceived"|"backNotification"|"restartRemoteDevice"|"uac"|"foregroundWindowElevated"|"stopService"|"elevationRequest"|"elevationResponse"|"portableServiceRunning"|"switchSidesRequest"|"switchBack"|"changeResolution"|"pluginRequest"|"pluginFailure"|"fullSpeedFps"|"autoAdjustFps"|"clientRecordStatus"|"captureDisplays"|"refreshVideoDisplay"|"toggleVirtualDisplay"|"togglePrivacyMode"|"supportedEncoding"|"selectedSid"|"changeDisplayResolution"|"messageQuery"|"followCurrentDisplay"|"requestCursorData");
        static encode(message: hbb.Misc.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.Misc & hbb.Misc.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace Misc {
        interface $Properties {
            chatMessage?: (hbb.ChatMessage.$Properties|null);
            switchDisplay?: (hbb.SwitchDisplay.$Properties|null);
            permissionInfo?: (hbb.PermissionInfo.$Properties|null);
            option?: (hbb.OptionMessage.$Properties|null);
            audioFormat?: (hbb.AudioFormat.$Properties|null);
            closeReason?: (string|null);
            refreshVideo?: (boolean|null);
            videoReceived?: (boolean|null);
            backNotification?: (hbb.BackNotification.$Properties|null);
            restartRemoteDevice?: (boolean|null);
            uac?: (boolean|null);
            foregroundWindowElevated?: (boolean|null);
            stopService?: (boolean|null);
            elevationRequest?: (hbb.ElevationRequest.$Properties|null);
            elevationResponse?: (string|null);
            portableServiceRunning?: (boolean|null);
            switchSidesRequest?: (hbb.SwitchSidesRequest.$Properties|null);
            switchBack?: (hbb.SwitchBack.$Properties|null);
            changeResolution?: (hbb.Resolution.$Properties|null);
            pluginRequest?: (hbb.PluginRequest.$Properties|null);
            pluginFailure?: (hbb.PluginFailure.$Properties|null);
            fullSpeedFps?: (number|null);
            autoAdjustFps?: (number|null);
            clientRecordStatus?: (boolean|null);
            captureDisplays?: (hbb.CaptureDisplays.$Properties|null);
            refreshVideoDisplay?: (number|null);
            toggleVirtualDisplay?: (hbb.ToggleVirtualDisplay.$Properties|null);
            togglePrivacyMode?: (hbb.TogglePrivacyMode.$Properties|null);
            supportedEncoding?: (hbb.SupportedEncoding.$Properties|null);
            selectedSid?: (number|null);
            changeDisplayResolution?: (hbb.DisplayResolution.$Properties|null);
            messageQuery?: (hbb.MessageQuery.$Properties|null);
            followCurrentDisplay?: (number|null);
            requestCursorData?: (number|Long|null);
            union?: ("chatMessage"|"switchDisplay"|"permissionInfo"|"option"|"audioFormat"|"closeReason"|"refreshVideo"|"videoReceived"|"backNotification"|"restartRemoteDevice"|"uac"|"foregroundWindowElevated"|"stopService"|"elevationRequest"|"elevationResponse"|"portableServiceRunning"|"switchSidesRequest"|"switchBack"|"changeResolution"|"pluginRequest"|"pluginFailure"|"fullSpeedFps"|"autoAdjustFps"|"clientRecordStatus"|"captureDisplays"|"refreshVideoDisplay"|"toggleVirtualDisplay"|"togglePrivacyMode"|"supportedEncoding"|"selectedSid"|"changeDisplayResolution"|"messageQuery"|"followCurrentDisplay"|"requestCursorData");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          chatMessage?: hbb.ChatMessage.$Shape|null;
          switchDisplay?: hbb.SwitchDisplay.$Shape|null;
          permissionInfo?: hbb.PermissionInfo.$Shape|null;
          option?: hbb.OptionMessage.$Shape|null;
          audioFormat?: hbb.AudioFormat.$Shape|null;
          closeReason?: string|null;
          refreshVideo?: boolean|null;
          videoReceived?: boolean|null;
          backNotification?: hbb.BackNotification.$Shape|null;
          restartRemoteDevice?: boolean|null;
          uac?: boolean|null;
          foregroundWindowElevated?: boolean|null;
          stopService?: boolean|null;
          elevationRequest?: hbb.ElevationRequest.$Shape|null;
          elevationResponse?: string|null;
          portableServiceRunning?: boolean|null;
          switchSidesRequest?: hbb.SwitchSidesRequest.$Shape|null;
          switchBack?: hbb.SwitchBack.$Shape|null;
          changeResolution?: hbb.Resolution.$Shape|null;
          pluginRequest?: hbb.PluginRequest.$Shape|null;
          pluginFailure?: hbb.PluginFailure.$Shape|null;
          fullSpeedFps?: number|null;
          autoAdjustFps?: number|null;
          clientRecordStatus?: boolean|null;
          captureDisplays?: hbb.CaptureDisplays.$Shape|null;
          refreshVideoDisplay?: number|null;
          toggleVirtualDisplay?: hbb.ToggleVirtualDisplay.$Shape|null;
          togglePrivacyMode?: hbb.TogglePrivacyMode.$Shape|null;
          supportedEncoding?: hbb.SupportedEncoding.$Shape|null;
          selectedSid?: number|null;
          changeDisplayResolution?: hbb.DisplayResolution.$Shape|null;
          messageQuery?: hbb.MessageQuery.$Shape|null;
          followCurrentDisplay?: number|null;
          requestCursorData?: number|Long|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "chatMessage"; chatMessage: hbb.ChatMessage.$Shape; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "switchDisplay"; chatMessage?: null; switchDisplay: hbb.SwitchDisplay.$Shape; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "permissionInfo"; chatMessage?: null; switchDisplay?: null; permissionInfo: hbb.PermissionInfo.$Shape; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "option"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option: hbb.OptionMessage.$Shape; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "audioFormat"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat: hbb.AudioFormat.$Shape; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "closeReason"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason: string; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "refreshVideo"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo: boolean; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "videoReceived"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived: boolean; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "backNotification"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification: hbb.BackNotification.$Shape; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "restartRemoteDevice"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice: boolean; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "uac"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac: boolean; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "foregroundWindowElevated"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated: boolean; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "stopService"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService: boolean; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "elevationRequest"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest: hbb.ElevationRequest.$Shape; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "elevationResponse"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse: string; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "portableServiceRunning"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning: boolean; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "switchSidesRequest"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest: hbb.SwitchSidesRequest.$Shape; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "switchBack"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack: hbb.SwitchBack.$Shape; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "changeResolution"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution: hbb.Resolution.$Shape; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "pluginRequest"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest: hbb.PluginRequest.$Shape; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "pluginFailure"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure: hbb.PluginFailure.$Shape; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "fullSpeedFps"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps: number; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "autoAdjustFps"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps: number; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "clientRecordStatus"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus: boolean; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "captureDisplays"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays: hbb.CaptureDisplays.$Shape; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "refreshVideoDisplay"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay: number; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "toggleVirtualDisplay"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay: hbb.ToggleVirtualDisplay.$Shape; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "togglePrivacyMode"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode: hbb.TogglePrivacyMode.$Shape; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "supportedEncoding"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding: hbb.SupportedEncoding.$Shape; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "selectedSid"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid: number; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "changeDisplayResolution"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution: hbb.DisplayResolution.$Shape; messageQuery?: null; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "messageQuery"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery: hbb.MessageQuery.$Shape; followCurrentDisplay?: null; requestCursorData?: null }|{ union?: "followCurrentDisplay"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay: number; requestCursorData?: null }|{ union?: "requestCursorData"; chatMessage?: null; switchDisplay?: null; permissionInfo?: null; option?: null; audioFormat?: null; closeReason?: null; refreshVideo?: null; videoReceived?: null; backNotification?: null; restartRemoteDevice?: null; uac?: null; foregroundWindowElevated?: null; stopService?: null; elevationRequest?: null; elevationResponse?: null; portableServiceRunning?: null; switchSidesRequest?: null; switchBack?: null; changeResolution?: null; pluginRequest?: null; pluginFailure?: null; fullSpeedFps?: null; autoAdjustFps?: null; clientRecordStatus?: null; captureDisplays?: null; refreshVideoDisplay?: null; toggleVirtualDisplay?: null; togglePrivacyMode?: null; supportedEncoding?: null; selectedSid?: null; changeDisplayResolution?: null; messageQuery?: null; followCurrentDisplay?: null; requestCursorData: number|Long })
        );
    }

    interface IVoiceCallRequest extends hbb.VoiceCallRequest.$Properties {
    }

    class VoiceCallRequest {
        constructor(properties?: hbb.VoiceCallRequest.$Properties);
        $unknowns?: Uint8Array[];
        reqTimestamp: (number|Long);
        isConnect: boolean;
        static encode(message: hbb.VoiceCallRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.VoiceCallRequest & hbb.VoiceCallRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace VoiceCallRequest {
        interface $Properties {
            reqTimestamp?: (number|Long|null);
            isConnect?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.VoiceCallRequest.$Properties;
    }

    interface IVoiceCallResponse extends hbb.VoiceCallResponse.$Properties {
    }

    class VoiceCallResponse {
        constructor(properties?: hbb.VoiceCallResponse.$Properties);
        $unknowns?: Uint8Array[];
        accepted: boolean;
        reqTimestamp: (number|Long);
        ackTimestamp: (number|Long);
        static encode(message: hbb.VoiceCallResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.VoiceCallResponse & hbb.VoiceCallResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace VoiceCallResponse {
        interface $Properties {
            accepted?: (boolean|null);
            reqTimestamp?: (number|Long|null);
            ackTimestamp?: (number|Long|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.VoiceCallResponse.$Properties;
    }

    interface IScreenshotRequest extends hbb.ScreenshotRequest.$Properties {
    }

    class ScreenshotRequest {
        constructor(properties?: hbb.ScreenshotRequest.$Properties);
        $unknowns?: Uint8Array[];
        display: number;
        sid: string;
        static encode(message: hbb.ScreenshotRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ScreenshotRequest & hbb.ScreenshotRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ScreenshotRequest {
        interface $Properties {
            display?: (number|null);
            sid?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ScreenshotRequest.$Properties;
    }

    interface IScreenshotResponse extends hbb.ScreenshotResponse.$Properties {
    }

    class ScreenshotResponse {
        constructor(properties?: hbb.ScreenshotResponse.$Properties);
        $unknowns?: Uint8Array[];
        sid: string;
        msg: string;
        data: Uint8Array;
        static encode(message: hbb.ScreenshotResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ScreenshotResponse & hbb.ScreenshotResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ScreenshotResponse {
        interface $Properties {
            sid?: (string|null);
            msg?: (string|null);
            data?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ScreenshotResponse.$Properties;
    }

    interface IOpenTerminal extends hbb.OpenTerminal.$Properties {
    }

    class OpenTerminal {
        constructor(properties?: hbb.OpenTerminal.$Properties);
        $unknowns?: Uint8Array[];
        terminalId: number;
        rows: number;
        cols: number;
        static encode(message: hbb.OpenTerminal.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.OpenTerminal & hbb.OpenTerminal.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace OpenTerminal {
        interface $Properties {
            terminalId?: (number|null);
            rows?: (number|null);
            cols?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.OpenTerminal.$Properties;
    }

    interface IResizeTerminal extends hbb.ResizeTerminal.$Properties {
    }

    class ResizeTerminal {
        constructor(properties?: hbb.ResizeTerminal.$Properties);
        $unknowns?: Uint8Array[];
        terminalId: number;
        rows: number;
        cols: number;
        static encode(message: hbb.ResizeTerminal.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ResizeTerminal & hbb.ResizeTerminal.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ResizeTerminal {
        interface $Properties {
            terminalId?: (number|null);
            rows?: (number|null);
            cols?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ResizeTerminal.$Properties;
    }

    interface ITerminalData extends hbb.TerminalData.$Properties {
    }

    class TerminalData {
        constructor(properties?: hbb.TerminalData.$Properties);
        $unknowns?: Uint8Array[];
        terminalId: number;
        data: Uint8Array;
        compressed: boolean;
        static encode(message: hbb.TerminalData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TerminalData & hbb.TerminalData.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TerminalData {
        interface $Properties {
            terminalId?: (number|null);
            data?: (Uint8Array|null);
            compressed?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TerminalData.$Properties;
    }

    interface ICloseTerminal extends hbb.CloseTerminal.$Properties {
    }

    class CloseTerminal {
        constructor(properties?: hbb.CloseTerminal.$Properties);
        $unknowns?: Uint8Array[];
        terminalId: number;
        static encode(message: hbb.CloseTerminal.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.CloseTerminal & hbb.CloseTerminal.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace CloseTerminal {
        interface $Properties {
            terminalId?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.CloseTerminal.$Properties;
    }

    interface ITerminalAction extends hbb.TerminalAction.$Properties {
    }

    class TerminalAction {
        constructor(properties?: hbb.TerminalAction.$Properties);
        $unknowns?: Uint8Array[];
        open?: (hbb.OpenTerminal.$Properties|null);
        data?: (hbb.TerminalData.$Properties|null);
        resize?: (hbb.ResizeTerminal.$Properties|null);
        close?: (hbb.CloseTerminal.$Properties|null);
        union?: ("open"|"data"|"resize"|"close");
        static encode(message: hbb.TerminalAction.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TerminalAction & hbb.TerminalAction.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TerminalAction {
        interface $Properties {
            open?: (hbb.OpenTerminal.$Properties|null);
            data?: (hbb.TerminalData.$Properties|null);
            resize?: (hbb.ResizeTerminal.$Properties|null);
            close?: (hbb.CloseTerminal.$Properties|null);
            union?: ("open"|"data"|"resize"|"close");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          open?: hbb.OpenTerminal.$Shape|null;
          data?: hbb.TerminalData.$Shape|null;
          resize?: hbb.ResizeTerminal.$Shape|null;
          close?: hbb.CloseTerminal.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; open?: null; data?: null; resize?: null; close?: null }|{ union?: "open"; open: hbb.OpenTerminal.$Shape; data?: null; resize?: null; close?: null }|{ union?: "data"; open?: null; data: hbb.TerminalData.$Shape; resize?: null; close?: null }|{ union?: "resize"; open?: null; data?: null; resize: hbb.ResizeTerminal.$Shape; close?: null }|{ union?: "close"; open?: null; data?: null; resize?: null; close: hbb.CloseTerminal.$Shape })
        );
    }

    interface ITerminalOpened extends hbb.TerminalOpened.$Properties {
    }

    class TerminalOpened {
        constructor(properties?: hbb.TerminalOpened.$Properties);
        $unknowns?: Uint8Array[];
        terminalId: number;
        success: boolean;
        message: string;
        pid: number;
        serviceId: string;
        persistentSessions: number[];
        replayTerminalOutput: boolean;
        static encode(message: hbb.TerminalOpened.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TerminalOpened & hbb.TerminalOpened.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TerminalOpened {
        interface $Properties {
            terminalId?: (number|null);
            success?: (boolean|null);
            message?: (string|null);
            pid?: (number|null);
            serviceId?: (string|null);
            persistentSessions?: (number[]|null);
            replayTerminalOutput?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TerminalOpened.$Properties;
    }

    interface ITerminalClosed extends hbb.TerminalClosed.$Properties {
    }

    class TerminalClosed {
        constructor(properties?: hbb.TerminalClosed.$Properties);
        $unknowns?: Uint8Array[];
        terminalId: number;
        exitCode: number;
        static encode(message: hbb.TerminalClosed.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TerminalClosed & hbb.TerminalClosed.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TerminalClosed {
        interface $Properties {
            terminalId?: (number|null);
            exitCode?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TerminalClosed.$Properties;
    }

    interface ITerminalError extends hbb.TerminalError.$Properties {
    }

    class TerminalError {
        constructor(properties?: hbb.TerminalError.$Properties);
        $unknowns?: Uint8Array[];
        terminalId: number;
        message: string;
        static encode(message: hbb.TerminalError.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TerminalError & hbb.TerminalError.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TerminalError {
        interface $Properties {
            terminalId?: (number|null);
            message?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TerminalError.$Properties;
    }

    interface ITerminalResponse extends hbb.TerminalResponse.$Properties {
    }

    class TerminalResponse {
        constructor(properties?: hbb.TerminalResponse.$Properties);
        $unknowns?: Uint8Array[];
        opened?: (hbb.TerminalOpened.$Properties|null);
        data?: (hbb.TerminalData.$Properties|null);
        closed?: (hbb.TerminalClosed.$Properties|null);
        error?: (hbb.TerminalError.$Properties|null);
        union?: ("opened"|"data"|"closed"|"error");
        static encode(message: hbb.TerminalResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TerminalResponse & hbb.TerminalResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TerminalResponse {
        interface $Properties {
            opened?: (hbb.TerminalOpened.$Properties|null);
            data?: (hbb.TerminalData.$Properties|null);
            closed?: (hbb.TerminalClosed.$Properties|null);
            error?: (hbb.TerminalError.$Properties|null);
            union?: ("opened"|"data"|"closed"|"error");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          opened?: hbb.TerminalOpened.$Shape|null;
          data?: hbb.TerminalData.$Shape|null;
          closed?: hbb.TerminalClosed.$Shape|null;
          error?: hbb.TerminalError.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; opened?: null; data?: null; closed?: null; error?: null }|{ union?: "opened"; opened: hbb.TerminalOpened.$Shape; data?: null; closed?: null; error?: null }|{ union?: "data"; opened?: null; data: hbb.TerminalData.$Shape; closed?: null; error?: null }|{ union?: "closed"; opened?: null; data?: null; closed: hbb.TerminalClosed.$Shape; error?: null }|{ union?: "error"; opened?: null; data?: null; closed?: null; error: hbb.TerminalError.$Shape })
        );
    }

    interface IPortForwardOpen extends hbb.PortForwardOpen.$Properties {
    }

    class PortForwardOpen {
        constructor(properties?: hbb.PortForwardOpen.$Properties);
        $unknowns?: Uint8Array[];
        channelId: number;
        host: string;
        port: number;
        window: number;
        static encode(message: hbb.PortForwardOpen.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PortForwardOpen & hbb.PortForwardOpen.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PortForwardOpen {
        interface $Properties {
            channelId?: (number|null);
            host?: (string|null);
            port?: (number|null);
            window?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PortForwardOpen.$Properties;
    }

    interface IPortForwardOpened extends hbb.PortForwardOpened.$Properties {
    }

    class PortForwardOpened {
        constructor(properties?: hbb.PortForwardOpened.$Properties);
        $unknowns?: Uint8Array[];
        channelId: number;
        success: boolean;
        message: string;
        window: number;
        static encode(message: hbb.PortForwardOpened.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PortForwardOpened & hbb.PortForwardOpened.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PortForwardOpened {
        interface $Properties {
            channelId?: (number|null);
            success?: (boolean|null);
            message?: (string|null);
            window?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PortForwardOpened.$Properties;
    }

    interface IPortForwardData extends hbb.PortForwardData.$Properties {
    }

    class PortForwardData {
        constructor(properties?: hbb.PortForwardData.$Properties);
        $unknowns?: Uint8Array[];
        channelId: number;
        data: Uint8Array;
        static encode(message: hbb.PortForwardData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PortForwardData & hbb.PortForwardData.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PortForwardData {
        interface $Properties {
            channelId?: (number|null);
            data?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PortForwardData.$Properties;
    }

    interface IPortForwardClose extends hbb.PortForwardClose.$Properties {
    }

    class PortForwardClose {
        constructor(properties?: hbb.PortForwardClose.$Properties);
        $unknowns?: Uint8Array[];
        channelId: number;
        static encode(message: hbb.PortForwardClose.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PortForwardClose & hbb.PortForwardClose.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PortForwardClose {
        interface $Properties {
            channelId?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PortForwardClose.$Properties;
    }

    interface IPortForwardWindowUpdate extends hbb.PortForwardWindowUpdate.$Properties {
    }

    class PortForwardWindowUpdate {
        constructor(properties?: hbb.PortForwardWindowUpdate.$Properties);
        $unknowns?: Uint8Array[];
        channelId: number;
        add: number;
        static encode(message: hbb.PortForwardWindowUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PortForwardWindowUpdate & hbb.PortForwardWindowUpdate.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PortForwardWindowUpdate {
        interface $Properties {
            channelId?: (number|null);
            add?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PortForwardWindowUpdate.$Properties;
    }

    interface IPortForwardChannel extends hbb.PortForwardChannel.$Properties {
    }

    class PortForwardChannel {
        constructor(properties?: hbb.PortForwardChannel.$Properties);
        $unknowns?: Uint8Array[];
        open?: (hbb.PortForwardOpen.$Properties|null);
        opened?: (hbb.PortForwardOpened.$Properties|null);
        data?: (hbb.PortForwardData.$Properties|null);
        close?: (hbb.PortForwardClose.$Properties|null);
        windowUpdate?: (hbb.PortForwardWindowUpdate.$Properties|null);
        union?: ("open"|"opened"|"data"|"close"|"windowUpdate");
        static encode(message: hbb.PortForwardChannel.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PortForwardChannel & hbb.PortForwardChannel.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PortForwardChannel {
        interface $Properties {
            open?: (hbb.PortForwardOpen.$Properties|null);
            opened?: (hbb.PortForwardOpened.$Properties|null);
            data?: (hbb.PortForwardData.$Properties|null);
            close?: (hbb.PortForwardClose.$Properties|null);
            windowUpdate?: (hbb.PortForwardWindowUpdate.$Properties|null);
            union?: ("open"|"opened"|"data"|"close"|"windowUpdate");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          open?: hbb.PortForwardOpen.$Shape|null;
          opened?: hbb.PortForwardOpened.$Shape|null;
          data?: hbb.PortForwardData.$Shape|null;
          close?: hbb.PortForwardClose.$Shape|null;
          windowUpdate?: hbb.PortForwardWindowUpdate.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; open?: null; opened?: null; data?: null; close?: null; windowUpdate?: null }|{ union?: "open"; open: hbb.PortForwardOpen.$Shape; opened?: null; data?: null; close?: null; windowUpdate?: null }|{ union?: "opened"; open?: null; opened: hbb.PortForwardOpened.$Shape; data?: null; close?: null; windowUpdate?: null }|{ union?: "data"; open?: null; opened?: null; data: hbb.PortForwardData.$Shape; close?: null; windowUpdate?: null }|{ union?: "close"; open?: null; opened?: null; data?: null; close: hbb.PortForwardClose.$Shape; windowUpdate?: null }|{ union?: "windowUpdate"; open?: null; opened?: null; data?: null; close?: null; windowUpdate: hbb.PortForwardWindowUpdate.$Shape })
        );
    }

    interface IMessage extends hbb.Message.$Properties {
    }

    class Message {
        constructor(properties?: hbb.Message.$Properties);
        $unknowns?: Uint8Array[];
        signedId?: (hbb.SignedId.$Properties|null);
        publicKey?: (hbb.PublicKey.$Properties|null);
        testDelay?: (hbb.TestDelay.$Properties|null);
        videoFrame?: (hbb.VideoFrame.$Properties|null);
        loginRequest?: (hbb.LoginRequest.$Properties|null);
        loginResponse?: (hbb.LoginResponse.$Properties|null);
        hash?: (hbb.Hash.$Properties|null);
        mouseEvent?: (hbb.MouseEvent.$Properties|null);
        audioFrame?: (hbb.AudioFrame.$Properties|null);
        cursorData?: (hbb.CursorData.$Properties|null);
        cursorPosition?: (hbb.CursorPosition.$Properties|null);
        cursorId?: (number|Long|null);
        keyEvent?: (hbb.KeyEvent.$Properties|null);
        clipboard?: (hbb.Clipboard.$Properties|null);
        fileAction?: (hbb.FileAction.$Properties|null);
        fileResponse?: (hbb.FileResponse.$Properties|null);
        misc?: (hbb.Misc.$Properties|null);
        cliprdr?: (hbb.Cliprdr.$Properties|null);
        messageBox?: (hbb.MessageBox.$Properties|null);
        switchSidesResponse?: (hbb.SwitchSidesResponse.$Properties|null);
        voiceCallRequest?: (hbb.VoiceCallRequest.$Properties|null);
        voiceCallResponse?: (hbb.VoiceCallResponse.$Properties|null);
        peerInfo?: (hbb.PeerInfo.$Properties|null);
        pointerDeviceEvent?: (hbb.PointerDeviceEvent.$Properties|null);
        auth_2fa?: (hbb.Auth2FA.$Properties|null);
        multiClipboards?: (hbb.MultiClipboards.$Properties|null);
        screenshotRequest?: (hbb.ScreenshotRequest.$Properties|null);
        screenshotResponse?: (hbb.ScreenshotResponse.$Properties|null);
        terminalAction?: (hbb.TerminalAction.$Properties|null);
        terminalResponse?: (hbb.TerminalResponse.$Properties|null);
        portForwardChannel?: (hbb.PortForwardChannel.$Properties|null);
        union?: ("signedId"|"publicKey"|"testDelay"|"videoFrame"|"loginRequest"|"loginResponse"|"hash"|"mouseEvent"|"audioFrame"|"cursorData"|"cursorPosition"|"cursorId"|"keyEvent"|"clipboard"|"fileAction"|"fileResponse"|"misc"|"cliprdr"|"messageBox"|"switchSidesResponse"|"voiceCallRequest"|"voiceCallResponse"|"peerInfo"|"pointerDeviceEvent"|"auth_2fa"|"multiClipboards"|"screenshotRequest"|"screenshotResponse"|"terminalAction"|"terminalResponse"|"portForwardChannel");
        static encode(message: hbb.Message.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.Message & hbb.Message.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace Message {
        interface $Properties {
            signedId?: (hbb.SignedId.$Properties|null);
            publicKey?: (hbb.PublicKey.$Properties|null);
            testDelay?: (hbb.TestDelay.$Properties|null);
            videoFrame?: (hbb.VideoFrame.$Properties|null);
            loginRequest?: (hbb.LoginRequest.$Properties|null);
            loginResponse?: (hbb.LoginResponse.$Properties|null);
            hash?: (hbb.Hash.$Properties|null);
            mouseEvent?: (hbb.MouseEvent.$Properties|null);
            audioFrame?: (hbb.AudioFrame.$Properties|null);
            cursorData?: (hbb.CursorData.$Properties|null);
            cursorPosition?: (hbb.CursorPosition.$Properties|null);
            cursorId?: (number|Long|null);
            keyEvent?: (hbb.KeyEvent.$Properties|null);
            clipboard?: (hbb.Clipboard.$Properties|null);
            fileAction?: (hbb.FileAction.$Properties|null);
            fileResponse?: (hbb.FileResponse.$Properties|null);
            misc?: (hbb.Misc.$Properties|null);
            cliprdr?: (hbb.Cliprdr.$Properties|null);
            messageBox?: (hbb.MessageBox.$Properties|null);
            switchSidesResponse?: (hbb.SwitchSidesResponse.$Properties|null);
            voiceCallRequest?: (hbb.VoiceCallRequest.$Properties|null);
            voiceCallResponse?: (hbb.VoiceCallResponse.$Properties|null);
            peerInfo?: (hbb.PeerInfo.$Properties|null);
            pointerDeviceEvent?: (hbb.PointerDeviceEvent.$Properties|null);
            auth_2fa?: (hbb.Auth2FA.$Properties|null);
            multiClipboards?: (hbb.MultiClipboards.$Properties|null);
            screenshotRequest?: (hbb.ScreenshotRequest.$Properties|null);
            screenshotResponse?: (hbb.ScreenshotResponse.$Properties|null);
            terminalAction?: (hbb.TerminalAction.$Properties|null);
            terminalResponse?: (hbb.TerminalResponse.$Properties|null);
            portForwardChannel?: (hbb.PortForwardChannel.$Properties|null);
            union?: ("signedId"|"publicKey"|"testDelay"|"videoFrame"|"loginRequest"|"loginResponse"|"hash"|"mouseEvent"|"audioFrame"|"cursorData"|"cursorPosition"|"cursorId"|"keyEvent"|"clipboard"|"fileAction"|"fileResponse"|"misc"|"cliprdr"|"messageBox"|"switchSidesResponse"|"voiceCallRequest"|"voiceCallResponse"|"peerInfo"|"pointerDeviceEvent"|"auth_2fa"|"multiClipboards"|"screenshotRequest"|"screenshotResponse"|"terminalAction"|"terminalResponse"|"portForwardChannel");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          signedId?: hbb.SignedId.$Shape|null;
          publicKey?: hbb.PublicKey.$Shape|null;
          testDelay?: hbb.TestDelay.$Shape|null;
          videoFrame?: hbb.VideoFrame.$Shape|null;
          loginRequest?: hbb.LoginRequest.$Shape|null;
          loginResponse?: hbb.LoginResponse.$Shape|null;
          hash?: hbb.Hash.$Shape|null;
          mouseEvent?: hbb.MouseEvent.$Shape|null;
          audioFrame?: hbb.AudioFrame.$Shape|null;
          cursorData?: hbb.CursorData.$Shape|null;
          cursorPosition?: hbb.CursorPosition.$Shape|null;
          cursorId?: number|Long|null;
          keyEvent?: hbb.KeyEvent.$Shape|null;
          clipboard?: hbb.Clipboard.$Shape|null;
          fileAction?: hbb.FileAction.$Shape|null;
          fileResponse?: hbb.FileResponse.$Shape|null;
          misc?: hbb.Misc.$Shape|null;
          cliprdr?: hbb.Cliprdr.$Shape|null;
          messageBox?: hbb.MessageBox.$Shape|null;
          switchSidesResponse?: hbb.SwitchSidesResponse.$Shape|null;
          voiceCallRequest?: hbb.VoiceCallRequest.$Shape|null;
          voiceCallResponse?: hbb.VoiceCallResponse.$Shape|null;
          peerInfo?: hbb.PeerInfo.$Shape|null;
          pointerDeviceEvent?: hbb.PointerDeviceEvent.$Shape|null;
          auth_2fa?: hbb.Auth2FA.$Shape|null;
          multiClipboards?: hbb.MultiClipboards.$Shape|null;
          screenshotRequest?: hbb.ScreenshotRequest.$Shape|null;
          screenshotResponse?: hbb.ScreenshotResponse.$Shape|null;
          terminalAction?: hbb.TerminalAction.$Shape|null;
          terminalResponse?: hbb.TerminalResponse.$Shape|null;
          portForwardChannel?: hbb.PortForwardChannel.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "signedId"; signedId: hbb.SignedId.$Shape; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "publicKey"; signedId?: null; publicKey: hbb.PublicKey.$Shape; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "testDelay"; signedId?: null; publicKey?: null; testDelay: hbb.TestDelay.$Shape; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "videoFrame"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame: hbb.VideoFrame.$Shape; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "loginRequest"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest: hbb.LoginRequest.$Shape; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "loginResponse"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse: hbb.LoginResponse.$Shape; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "hash"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash: hbb.Hash.$Shape; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "mouseEvent"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent: hbb.MouseEvent.$Shape; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "audioFrame"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame: hbb.AudioFrame.$Shape; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "cursorData"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData: hbb.CursorData.$Shape; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "cursorPosition"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition: hbb.CursorPosition.$Shape; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "cursorId"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId: number|Long; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "keyEvent"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent: hbb.KeyEvent.$Shape; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "clipboard"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard: hbb.Clipboard.$Shape; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "fileAction"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction: hbb.FileAction.$Shape; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "fileResponse"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse: hbb.FileResponse.$Shape; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "misc"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc: hbb.Misc.$Shape; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "cliprdr"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr: hbb.Cliprdr.$Shape; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "messageBox"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox: hbb.MessageBox.$Shape; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "switchSidesResponse"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse: hbb.SwitchSidesResponse.$Shape; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "voiceCallRequest"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest: hbb.VoiceCallRequest.$Shape; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "voiceCallResponse"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse: hbb.VoiceCallResponse.$Shape; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "peerInfo"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo: hbb.PeerInfo.$Shape; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "pointerDeviceEvent"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent: hbb.PointerDeviceEvent.$Shape; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "auth_2fa"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa: hbb.Auth2FA.$Shape; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "multiClipboards"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards: hbb.MultiClipboards.$Shape; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "screenshotRequest"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest: hbb.ScreenshotRequest.$Shape; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "screenshotResponse"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse: hbb.ScreenshotResponse.$Shape; terminalAction?: null; terminalResponse?: null; portForwardChannel?: null }|{ union?: "terminalAction"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction: hbb.TerminalAction.$Shape; terminalResponse?: null; portForwardChannel?: null }|{ union?: "terminalResponse"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse: hbb.TerminalResponse.$Shape; portForwardChannel?: null }|{ union?: "portForwardChannel"; signedId?: null; publicKey?: null; testDelay?: null; videoFrame?: null; loginRequest?: null; loginResponse?: null; hash?: null; mouseEvent?: null; audioFrame?: null; cursorData?: null; cursorPosition?: null; cursorId?: null; keyEvent?: null; clipboard?: null; fileAction?: null; fileResponse?: null; misc?: null; cliprdr?: null; messageBox?: null; switchSidesResponse?: null; voiceCallRequest?: null; voiceCallResponse?: null; peerInfo?: null; pointerDeviceEvent?: null; auth_2fa?: null; multiClipboards?: null; screenshotRequest?: null; screenshotResponse?: null; terminalAction?: null; terminalResponse?: null; portForwardChannel: hbb.PortForwardChannel.$Shape })
        );
    }

    interface IIdPk extends hbb.IdPk.$Properties {
    }

    class IdPk {
        constructor(properties?: hbb.IdPk.$Properties);
        $unknowns?: Uint8Array[];
        id: string;
        pk: Uint8Array;
        dtlsFingerprint: string;
        kxVersion: number;
        static encode(message: hbb.IdPk.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.IdPk & hbb.IdPk.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace IdPk {
        interface $Properties {
            id?: (string|null);
            pk?: (Uint8Array|null);
            dtlsFingerprint?: (string|null);
            kxVersion?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.IdPk.$Properties;
    }

    interface IRegisterPeer extends hbb.RegisterPeer.$Properties {
    }

    class RegisterPeer {
        constructor(properties?: hbb.RegisterPeer.$Properties);
        $unknowns?: Uint8Array[];
        id: string;
        serial: number;
        static encode(message: hbb.RegisterPeer.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.RegisterPeer & hbb.RegisterPeer.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace RegisterPeer {
        interface $Properties {
            id?: (string|null);
            serial?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.RegisterPeer.$Properties;
    }

    enum ConnType {
        DEFAULT_CONN = 0,
        FILE_TRANSFER = 1,
        PORT_FORWARD = 2,
        RDP = 3,
        VIEW_CAMERA = 4,
        TERMINAL = 5
    }

    interface IRegisterPeerResponse extends hbb.RegisterPeerResponse.$Properties {
    }

    class RegisterPeerResponse {
        constructor(properties?: hbb.RegisterPeerResponse.$Properties);
        $unknowns?: Uint8Array[];
        requestPk: boolean;
        static encode(message: hbb.RegisterPeerResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.RegisterPeerResponse & hbb.RegisterPeerResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace RegisterPeerResponse {
        interface $Properties {
            requestPk?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.RegisterPeerResponse.$Properties;
    }

    interface IPunchHoleRequest extends hbb.PunchHoleRequest.$Properties {
    }

    class PunchHoleRequest {
        constructor(properties?: hbb.PunchHoleRequest.$Properties);
        $unknowns?: Uint8Array[];
        id: string;
        natType: hbb.NatType;
        licenceKey: string;
        connType: hbb.ConnType;
        token: string;
        version: string;
        udpPort: number;
        forceRelay: boolean;
        upnpPort: number;
        socketAddrV6: Uint8Array;
        switchCode: string;
        webrtcSdpOffer: string;
        static encode(message: hbb.PunchHoleRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PunchHoleRequest & hbb.PunchHoleRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PunchHoleRequest {
        interface $Properties {
            id?: (string|null);
            natType?: (hbb.NatType|null);
            licenceKey?: (string|null);
            connType?: (hbb.ConnType|null);
            token?: (string|null);
            version?: (string|null);
            udpPort?: (number|null);
            forceRelay?: (boolean|null);
            upnpPort?: (number|null);
            socketAddrV6?: (Uint8Array|null);
            switchCode?: (string|null);
            webrtcSdpOffer?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PunchHoleRequest.$Properties;
    }

    interface IControlPermissions extends hbb.ControlPermissions.$Properties {
    }

    class ControlPermissions {
        constructor(properties?: hbb.ControlPermissions.$Properties);
        $unknowns?: Uint8Array[];
        permissions: (number|Long);
        static encode(message: hbb.ControlPermissions.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ControlPermissions & hbb.ControlPermissions.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ControlPermissions {
        interface $Properties {
            permissions?: (number|Long|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ControlPermissions.$Properties;

        enum Permission {
            keyboard = 0,
            remote_printer = 1,
            clipboard = 2,
            file = 3,
            audio = 4,
            camera = 5,
            terminal = 6,
            tunnel = 7,
            restart = 8,
            recording = 9,
            block_input = 10,
            remote_modify = 11,
            privacy_mode = 12
        }
    }

    interface IControlledContext extends hbb.ControlledContext.$Properties {
    }

    class ControlledContext {
        constructor(properties?: hbb.ControlledContext.$Properties);
        $unknowns?: Uint8Array[];
        connAuditRef: string;
        static encode(message: hbb.ControlledContext.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ControlledContext & hbb.ControlledContext.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ControlledContext {
        interface $Properties {
            connAuditRef?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ControlledContext.$Properties;
    }

    interface IPunchHole extends hbb.PunchHole.$Properties {
    }

    class PunchHole {
        constructor(properties?: hbb.PunchHole.$Properties);
        $unknowns?: Uint8Array[];
        socketAddr: Uint8Array;
        relayServer: string;
        natType: hbb.NatType;
        udpPort: number;
        forceRelay: boolean;
        upnpPort: number;
        socketAddrV6: Uint8Array;
        controlPermissions?: (hbb.ControlPermissions.$Properties|null);
        controlledContext?: (hbb.ControlledContext.$Properties|null);
        webrtcSdpOffer: string;
        static encode(message: hbb.PunchHole.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PunchHole & hbb.PunchHole.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PunchHole {
        interface $Properties {
            socketAddr?: (Uint8Array|null);
            relayServer?: (string|null);
            natType?: (hbb.NatType|null);
            udpPort?: (number|null);
            forceRelay?: (boolean|null);
            upnpPort?: (number|null);
            socketAddrV6?: (Uint8Array|null);
            controlPermissions?: (hbb.ControlPermissions.$Properties|null);
            controlledContext?: (hbb.ControlledContext.$Properties|null);
            webrtcSdpOffer?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PunchHole.$Properties;
    }

    interface ITestNatRequest extends hbb.TestNatRequest.$Properties {
    }

    class TestNatRequest {
        constructor(properties?: hbb.TestNatRequest.$Properties);
        $unknowns?: Uint8Array[];
        serial: number;
        static encode(message: hbb.TestNatRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TestNatRequest & hbb.TestNatRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TestNatRequest {
        interface $Properties {
            serial?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TestNatRequest.$Properties;
    }

    interface ITestNatResponse extends hbb.TestNatResponse.$Properties {
    }

    class TestNatResponse {
        constructor(properties?: hbb.TestNatResponse.$Properties);
        $unknowns?: Uint8Array[];
        port: number;
        cu?: (hbb.ConfigUpdate.$Properties|null);
        static encode(message: hbb.TestNatResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.TestNatResponse & hbb.TestNatResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace TestNatResponse {
        interface $Properties {
            port?: (number|null);
            cu?: (hbb.ConfigUpdate.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.TestNatResponse.$Properties;
    }

    enum NatType {
        UNKNOWN_NAT = 0,
        ASYMMETRIC = 1,
        SYMMETRIC = 2
    }

    interface IPunchHoleSent extends hbb.PunchHoleSent.$Properties {
    }

    class PunchHoleSent {
        constructor(properties?: hbb.PunchHoleSent.$Properties);
        $unknowns?: Uint8Array[];
        socketAddr: Uint8Array;
        id: string;
        relayServer: string;
        natType: hbb.NatType;
        version: string;
        upnpPort: number;
        socketAddrV6: Uint8Array;
        webrtcSdpAnswer: string;
        static encode(message: hbb.PunchHoleSent.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PunchHoleSent & hbb.PunchHoleSent.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PunchHoleSent {
        interface $Properties {
            socketAddr?: (Uint8Array|null);
            id?: (string|null);
            relayServer?: (string|null);
            natType?: (hbb.NatType|null);
            version?: (string|null);
            upnpPort?: (number|null);
            socketAddrV6?: (Uint8Array|null);
            webrtcSdpAnswer?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PunchHoleSent.$Properties;
    }

    interface IRegisterPk extends hbb.RegisterPk.$Properties {
    }

    class RegisterPk {
        constructor(properties?: hbb.RegisterPk.$Properties);
        $unknowns?: Uint8Array[];
        id: string;
        uuid: Uint8Array;
        pk: Uint8Array;
        oldId: string;
        noRegisterDevice: boolean;
        static encode(message: hbb.RegisterPk.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.RegisterPk & hbb.RegisterPk.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace RegisterPk {
        interface $Properties {
            id?: (string|null);
            uuid?: (Uint8Array|null);
            pk?: (Uint8Array|null);
            oldId?: (string|null);
            noRegisterDevice?: (boolean|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.RegisterPk.$Properties;
    }

    interface IRegisterPkResponse extends hbb.RegisterPkResponse.$Properties {
    }

    class RegisterPkResponse {
        constructor(properties?: hbb.RegisterPkResponse.$Properties);
        $unknowns?: Uint8Array[];
        result: hbb.RegisterPkResponse.Result;
        keepAlive: number;
        static encode(message: hbb.RegisterPkResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.RegisterPkResponse & hbb.RegisterPkResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace RegisterPkResponse {
        interface $Properties {
            result?: (hbb.RegisterPkResponse.Result|null);
            keepAlive?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.RegisterPkResponse.$Properties;

        enum Result {
            OK = 0,
            UUID_MISMATCH = 2,
            ID_EXISTS = 3,
            TOO_FREQUENT = 4,
            INVALID_ID_FORMAT = 5,
            NOT_SUPPORT = 6,
            SERVER_ERROR = 7,
            NOT_DEPLOYED = 8
        }
    }

    interface IPunchHoleResponse extends hbb.PunchHoleResponse.$Properties {
    }

    class PunchHoleResponse {
        constructor(properties?: hbb.PunchHoleResponse.$Properties);
        $unknowns?: Uint8Array[];
        socketAddr: Uint8Array;
        pk: Uint8Array;
        failure: hbb.PunchHoleResponse.Failure;
        relayServer: string;
        natType?: (hbb.NatType|null);
        isLocal?: (boolean|null);
        otherFailure: string;
        feedback: number;
        isUdp: boolean;
        upnpPort: number;
        socketAddrV6: Uint8Array;
        webrtcSdpAnswer: string;
        union?: ("natType"|"isLocal");
        static encode(message: hbb.PunchHoleResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PunchHoleResponse & hbb.PunchHoleResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PunchHoleResponse {
        interface $Properties {
            socketAddr?: (Uint8Array|null);
            pk?: (Uint8Array|null);
            failure?: (hbb.PunchHoleResponse.Failure|null);
            relayServer?: (string|null);
            natType?: (hbb.NatType|null);
            isLocal?: (boolean|null);
            otherFailure?: (string|null);
            feedback?: (number|null);
            isUdp?: (boolean|null);
            upnpPort?: (number|null);
            socketAddrV6?: (Uint8Array|null);
            webrtcSdpAnswer?: (string|null);
            union?: ("natType"|"isLocal");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          socketAddr?: Uint8Array|null;
          pk?: Uint8Array|null;
          failure?: hbb.PunchHoleResponse.Failure|null;
          relayServer?: string|null;
          natType?: hbb.NatType|null;
          isLocal?: boolean|null;
          otherFailure?: string|null;
          feedback?: number|null;
          isUdp?: boolean|null;
          upnpPort?: number|null;
          socketAddrV6?: Uint8Array|null;
          webrtcSdpAnswer?: string|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; natType?: null; isLocal?: null }|{ union?: "natType"; natType: hbb.NatType; isLocal?: null }|{ union?: "isLocal"; natType?: null; isLocal: boolean })
        );

        enum Failure {
            ID_NOT_EXIST = 0,
            OFFLINE = 2,
            LICENSE_MISMATCH = 3,
            LICENSE_OVERUSE = 4
        }
    }

    interface IConfigUpdate extends hbb.ConfigUpdate.$Properties {
    }

    class ConfigUpdate {
        constructor(properties?: hbb.ConfigUpdate.$Properties);
        $unknowns?: Uint8Array[];
        serial: number;
        rendezvousServers: string[];
        static encode(message: hbb.ConfigUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.ConfigUpdate & hbb.ConfigUpdate.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace ConfigUpdate {
        interface $Properties {
            serial?: (number|null);
            rendezvousServers?: (string[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.ConfigUpdate.$Properties;
    }

    interface IRequestRelay extends hbb.RequestRelay.$Properties {
    }

    class RequestRelay {
        constructor(properties?: hbb.RequestRelay.$Properties);
        $unknowns?: Uint8Array[];
        id: string;
        uuid: string;
        socketAddr: Uint8Array;
        relayServer: string;
        secure: boolean;
        licenceKey: string;
        connType: hbb.ConnType;
        token: string;
        controlPermissions?: (hbb.ControlPermissions.$Properties|null);
        controlledContext?: (hbb.ControlledContext.$Properties|null);
        switchCode: string;
        static encode(message: hbb.RequestRelay.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.RequestRelay & hbb.RequestRelay.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace RequestRelay {
        interface $Properties {
            id?: (string|null);
            uuid?: (string|null);
            socketAddr?: (Uint8Array|null);
            relayServer?: (string|null);
            secure?: (boolean|null);
            licenceKey?: (string|null);
            connType?: (hbb.ConnType|null);
            token?: (string|null);
            controlPermissions?: (hbb.ControlPermissions.$Properties|null);
            controlledContext?: (hbb.ControlledContext.$Properties|null);
            switchCode?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.RequestRelay.$Properties;
    }

    interface IRelayResponse extends hbb.RelayResponse.$Properties {
    }

    class RelayResponse {
        constructor(properties?: hbb.RelayResponse.$Properties);
        $unknowns?: Uint8Array[];
        socketAddr: Uint8Array;
        uuid: string;
        relayServer: string;
        id?: (string|null);
        pk?: (Uint8Array|null);
        refuseReason: string;
        version: string;
        feedback: number;
        socketAddrV6: Uint8Array;
        upnpPort: number;
        webrtcSdpAnswer: string;
        union?: ("id"|"pk");
        static encode(message: hbb.RelayResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.RelayResponse & hbb.RelayResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace RelayResponse {
        interface $Properties {
            socketAddr?: (Uint8Array|null);
            uuid?: (string|null);
            relayServer?: (string|null);
            id?: (string|null);
            pk?: (Uint8Array|null);
            refuseReason?: (string|null);
            version?: (string|null);
            feedback?: (number|null);
            socketAddrV6?: (Uint8Array|null);
            upnpPort?: (number|null);
            webrtcSdpAnswer?: (string|null);
            union?: ("id"|"pk");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          socketAddr?: Uint8Array|null;
          uuid?: string|null;
          relayServer?: string|null;
          id?: string|null;
          pk?: Uint8Array|null;
          refuseReason?: string|null;
          version?: string|null;
          feedback?: number|null;
          socketAddrV6?: Uint8Array|null;
          upnpPort?: number|null;
          webrtcSdpAnswer?: string|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; id?: null; pk?: null }|{ union?: "id"; id: string; pk?: null }|{ union?: "pk"; id?: null; pk: Uint8Array })
        );
    }

    interface ISoftwareUpdate extends hbb.SoftwareUpdate.$Properties {
    }

    class SoftwareUpdate {
        constructor(properties?: hbb.SoftwareUpdate.$Properties);
        $unknowns?: Uint8Array[];
        url: string;
        static encode(message: hbb.SoftwareUpdate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.SoftwareUpdate & hbb.SoftwareUpdate.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace SoftwareUpdate {
        interface $Properties {
            url?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.SoftwareUpdate.$Properties;
    }

    interface IFetchLocalAddr extends hbb.FetchLocalAddr.$Properties {
    }

    class FetchLocalAddr {
        constructor(properties?: hbb.FetchLocalAddr.$Properties);
        $unknowns?: Uint8Array[];
        socketAddr: Uint8Array;
        relayServer: string;
        socketAddrV6: Uint8Array;
        controlPermissions?: (hbb.ControlPermissions.$Properties|null);
        controlledContext?: (hbb.ControlledContext.$Properties|null);
        static encode(message: hbb.FetchLocalAddr.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.FetchLocalAddr & hbb.FetchLocalAddr.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace FetchLocalAddr {
        interface $Properties {
            socketAddr?: (Uint8Array|null);
            relayServer?: (string|null);
            socketAddrV6?: (Uint8Array|null);
            controlPermissions?: (hbb.ControlPermissions.$Properties|null);
            controlledContext?: (hbb.ControlledContext.$Properties|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.FetchLocalAddr.$Properties;
    }

    interface ILocalAddr extends hbb.LocalAddr.$Properties {
    }

    class LocalAddr {
        constructor(properties?: hbb.LocalAddr.$Properties);
        $unknowns?: Uint8Array[];
        socketAddr: Uint8Array;
        localAddr: Uint8Array;
        relayServer: string;
        id: string;
        version: string;
        socketAddrV6: Uint8Array;
        static encode(message: hbb.LocalAddr.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.LocalAddr & hbb.LocalAddr.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace LocalAddr {
        interface $Properties {
            socketAddr?: (Uint8Array|null);
            localAddr?: (Uint8Array|null);
            relayServer?: (string|null);
            id?: (string|null);
            version?: (string|null);
            socketAddrV6?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.LocalAddr.$Properties;
    }

    interface IPeerDiscovery extends hbb.PeerDiscovery.$Properties {
    }

    class PeerDiscovery {
        constructor(properties?: hbb.PeerDiscovery.$Properties);
        $unknowns?: Uint8Array[];
        cmd: string;
        mac: string;
        id: string;
        username: string;
        hostname: string;
        platform: string;
        misc: string;
        static encode(message: hbb.PeerDiscovery.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.PeerDiscovery & hbb.PeerDiscovery.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace PeerDiscovery {
        interface $Properties {
            cmd?: (string|null);
            mac?: (string|null);
            id?: (string|null);
            username?: (string|null);
            hostname?: (string|null);
            platform?: (string|null);
            misc?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.PeerDiscovery.$Properties;
    }

    interface IOnlineRequest extends hbb.OnlineRequest.$Properties {
    }

    class OnlineRequest {
        constructor(properties?: hbb.OnlineRequest.$Properties);
        $unknowns?: Uint8Array[];
        id: string;
        peers: string[];
        static encode(message: hbb.OnlineRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.OnlineRequest & hbb.OnlineRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace OnlineRequest {
        interface $Properties {
            id?: (string|null);
            peers?: (string[]|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.OnlineRequest.$Properties;
    }

    interface IOnlineResponse extends hbb.OnlineResponse.$Properties {
    }

    class OnlineResponse {
        constructor(properties?: hbb.OnlineResponse.$Properties);
        $unknowns?: Uint8Array[];
        states: Uint8Array;
        static encode(message: hbb.OnlineResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.OnlineResponse & hbb.OnlineResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace OnlineResponse {
        interface $Properties {
            states?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.OnlineResponse.$Properties;
    }

    interface IKeyExchange extends hbb.KeyExchange.$Properties {
    }

    class KeyExchange {
        constructor(properties?: hbb.KeyExchange.$Properties);
        $unknowns?: Uint8Array[];
        keys: Uint8Array[];
        version: number;
        signedParams: Uint8Array;
        static encode(message: hbb.KeyExchange.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.KeyExchange & hbb.KeyExchange.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace KeyExchange {
        interface $Properties {
            keys?: (Uint8Array[]|null);
            version?: (number|null);
            signedParams?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.KeyExchange.$Properties;
    }

    interface IKxParams extends hbb.KxParams.$Properties {
    }

    class KxParams {
        constructor(properties?: hbb.KxParams.$Properties);
        $unknowns?: Uint8Array[];
        pk: Uint8Array;
        version: number;
        static encode(message: hbb.KxParams.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.KxParams & hbb.KxParams.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace KxParams {
        interface $Properties {
            pk?: (Uint8Array|null);
            version?: (number|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.KxParams.$Properties;
    }

    interface IHealthCheck extends hbb.HealthCheck.$Properties {
    }

    class HealthCheck {
        constructor(properties?: hbb.HealthCheck.$Properties);
        $unknowns?: Uint8Array[];
        token: string;
        static encode(message: hbb.HealthCheck.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.HealthCheck & hbb.HealthCheck.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace HealthCheck {
        interface $Properties {
            token?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.HealthCheck.$Properties;
    }

    interface IHeaderEntry extends hbb.HeaderEntry.$Properties {
    }

    class HeaderEntry {
        constructor(properties?: hbb.HeaderEntry.$Properties);
        $unknowns?: Uint8Array[];
        name: string;
        value: string;
        static encode(message: hbb.HeaderEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.HeaderEntry & hbb.HeaderEntry.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace HeaderEntry {
        interface $Properties {
            name?: (string|null);
            value?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.HeaderEntry.$Properties;
    }

    interface IHttpProxyRequest extends hbb.HttpProxyRequest.$Properties {
    }

    class HttpProxyRequest {
        constructor(properties?: hbb.HttpProxyRequest.$Properties);
        $unknowns?: Uint8Array[];
        method: string;
        path: string;
        headers: hbb.HeaderEntry.$Properties[];
        body: Uint8Array;
        static encode(message: hbb.HttpProxyRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.HttpProxyRequest & hbb.HttpProxyRequest.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace HttpProxyRequest {
        interface $Properties {
            method?: (string|null);
            path?: (string|null);
            headers?: (hbb.HeaderEntry.$Properties[]|null);
            body?: (Uint8Array|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.HttpProxyRequest.$Properties;
    }

    interface IHttpProxyResponse extends hbb.HttpProxyResponse.$Properties {
    }

    class HttpProxyResponse {
        constructor(properties?: hbb.HttpProxyResponse.$Properties);
        $unknowns?: Uint8Array[];
        status: number;
        headers: hbb.HeaderEntry.$Properties[];
        body: Uint8Array;
        error: string;
        static encode(message: hbb.HttpProxyResponse.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.HttpProxyResponse & hbb.HttpProxyResponse.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace HttpProxyResponse {
        interface $Properties {
            status?: (number|null);
            headers?: (hbb.HeaderEntry.$Properties[]|null);
            body?: (Uint8Array|null);
            error?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.HttpProxyResponse.$Properties;
    }

    interface IIceCandidate extends hbb.IceCandidate.$Properties {
    }

    class IceCandidate {
        constructor(properties?: hbb.IceCandidate.$Properties);
        $unknowns?: Uint8Array[];
        id: string;
        socketAddr: Uint8Array;
        sessionKey: string;
        candidate: string;
        static encode(message: hbb.IceCandidate.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.IceCandidate & hbb.IceCandidate.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace IceCandidate {
        interface $Properties {
            id?: (string|null);
            socketAddr?: (Uint8Array|null);
            sessionKey?: (string|null);
            candidate?: (string|null);
            $unknowns?: Uint8Array[];
        }
        type $Shape = hbb.IceCandidate.$Properties;
    }

    interface IRendezvousMessage extends hbb.RendezvousMessage.$Properties {
    }

    class RendezvousMessage {
        constructor(properties?: hbb.RendezvousMessage.$Properties);
        $unknowns?: Uint8Array[];
        registerPeer?: (hbb.RegisterPeer.$Properties|null);
        registerPeerResponse?: (hbb.RegisterPeerResponse.$Properties|null);
        punchHoleRequest?: (hbb.PunchHoleRequest.$Properties|null);
        punchHole?: (hbb.PunchHole.$Properties|null);
        punchHoleSent?: (hbb.PunchHoleSent.$Properties|null);
        punchHoleResponse?: (hbb.PunchHoleResponse.$Properties|null);
        fetchLocalAddr?: (hbb.FetchLocalAddr.$Properties|null);
        localAddr?: (hbb.LocalAddr.$Properties|null);
        configureUpdate?: (hbb.ConfigUpdate.$Properties|null);
        registerPk?: (hbb.RegisterPk.$Properties|null);
        registerPkResponse?: (hbb.RegisterPkResponse.$Properties|null);
        softwareUpdate?: (hbb.SoftwareUpdate.$Properties|null);
        requestRelay?: (hbb.RequestRelay.$Properties|null);
        relayResponse?: (hbb.RelayResponse.$Properties|null);
        testNatRequest?: (hbb.TestNatRequest.$Properties|null);
        testNatResponse?: (hbb.TestNatResponse.$Properties|null);
        peerDiscovery?: (hbb.PeerDiscovery.$Properties|null);
        onlineRequest?: (hbb.OnlineRequest.$Properties|null);
        onlineResponse?: (hbb.OnlineResponse.$Properties|null);
        keyExchange?: (hbb.KeyExchange.$Properties|null);
        hc?: (hbb.HealthCheck.$Properties|null);
        httpProxyRequest?: (hbb.HttpProxyRequest.$Properties|null);
        httpProxyResponse?: (hbb.HttpProxyResponse.$Properties|null);
        iceCandidate?: (hbb.IceCandidate.$Properties|null);
        union?: ("registerPeer"|"registerPeerResponse"|"punchHoleRequest"|"punchHole"|"punchHoleSent"|"punchHoleResponse"|"fetchLocalAddr"|"localAddr"|"configureUpdate"|"registerPk"|"registerPkResponse"|"softwareUpdate"|"requestRelay"|"relayResponse"|"testNatRequest"|"testNatResponse"|"peerDiscovery"|"onlineRequest"|"onlineResponse"|"keyExchange"|"hc"|"httpProxyRequest"|"httpProxyResponse"|"iceCandidate");
        static encode(message: hbb.RendezvousMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): hbb.RendezvousMessage & hbb.RendezvousMessage.$Shape;
        static getTypeUrl(prefix?: string): string;
    }

    namespace RendezvousMessage {
        interface $Properties {
            registerPeer?: (hbb.RegisterPeer.$Properties|null);
            registerPeerResponse?: (hbb.RegisterPeerResponse.$Properties|null);
            punchHoleRequest?: (hbb.PunchHoleRequest.$Properties|null);
            punchHole?: (hbb.PunchHole.$Properties|null);
            punchHoleSent?: (hbb.PunchHoleSent.$Properties|null);
            punchHoleResponse?: (hbb.PunchHoleResponse.$Properties|null);
            fetchLocalAddr?: (hbb.FetchLocalAddr.$Properties|null);
            localAddr?: (hbb.LocalAddr.$Properties|null);
            configureUpdate?: (hbb.ConfigUpdate.$Properties|null);
            registerPk?: (hbb.RegisterPk.$Properties|null);
            registerPkResponse?: (hbb.RegisterPkResponse.$Properties|null);
            softwareUpdate?: (hbb.SoftwareUpdate.$Properties|null);
            requestRelay?: (hbb.RequestRelay.$Properties|null);
            relayResponse?: (hbb.RelayResponse.$Properties|null);
            testNatRequest?: (hbb.TestNatRequest.$Properties|null);
            testNatResponse?: (hbb.TestNatResponse.$Properties|null);
            peerDiscovery?: (hbb.PeerDiscovery.$Properties|null);
            onlineRequest?: (hbb.OnlineRequest.$Properties|null);
            onlineResponse?: (hbb.OnlineResponse.$Properties|null);
            keyExchange?: (hbb.KeyExchange.$Properties|null);
            hc?: (hbb.HealthCheck.$Properties|null);
            httpProxyRequest?: (hbb.HttpProxyRequest.$Properties|null);
            httpProxyResponse?: (hbb.HttpProxyResponse.$Properties|null);
            iceCandidate?: (hbb.IceCandidate.$Properties|null);
            union?: ("registerPeer"|"registerPeerResponse"|"punchHoleRequest"|"punchHole"|"punchHoleSent"|"punchHoleResponse"|"fetchLocalAddr"|"localAddr"|"configureUpdate"|"registerPk"|"registerPkResponse"|"softwareUpdate"|"requestRelay"|"relayResponse"|"testNatRequest"|"testNatResponse"|"peerDiscovery"|"onlineRequest"|"onlineResponse"|"keyExchange"|"hc"|"httpProxyRequest"|"httpProxyResponse"|"iceCandidate");
            $unknowns?: Uint8Array[];
        }
        type $Shape = {
          registerPeer?: hbb.RegisterPeer.$Shape|null;
          registerPeerResponse?: hbb.RegisterPeerResponse.$Shape|null;
          punchHoleRequest?: hbb.PunchHoleRequest.$Shape|null;
          punchHole?: hbb.PunchHole.$Shape|null;
          punchHoleSent?: hbb.PunchHoleSent.$Shape|null;
          punchHoleResponse?: hbb.PunchHoleResponse.$Shape|null;
          fetchLocalAddr?: hbb.FetchLocalAddr.$Shape|null;
          localAddr?: hbb.LocalAddr.$Shape|null;
          configureUpdate?: hbb.ConfigUpdate.$Shape|null;
          registerPk?: hbb.RegisterPk.$Shape|null;
          registerPkResponse?: hbb.RegisterPkResponse.$Shape|null;
          softwareUpdate?: hbb.SoftwareUpdate.$Shape|null;
          requestRelay?: hbb.RequestRelay.$Shape|null;
          relayResponse?: hbb.RelayResponse.$Shape|null;
          testNatRequest?: hbb.TestNatRequest.$Shape|null;
          testNatResponse?: hbb.TestNatResponse.$Shape|null;
          peerDiscovery?: hbb.PeerDiscovery.$Shape|null;
          onlineRequest?: hbb.OnlineRequest.$Shape|null;
          onlineResponse?: hbb.OnlineResponse.$Shape|null;
          keyExchange?: hbb.KeyExchange.$Shape|null;
          hc?: hbb.HealthCheck.$Shape|null;
          httpProxyRequest?: hbb.HttpProxyRequest.$Shape|null;
          httpProxyResponse?: hbb.HttpProxyResponse.$Shape|null;
          iceCandidate?: hbb.IceCandidate.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ union?: undefined; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "registerPeer"; registerPeer: hbb.RegisterPeer.$Shape; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "registerPeerResponse"; registerPeer?: null; registerPeerResponse: hbb.RegisterPeerResponse.$Shape; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "punchHoleRequest"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest: hbb.PunchHoleRequest.$Shape; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "punchHole"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole: hbb.PunchHole.$Shape; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "punchHoleSent"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent: hbb.PunchHoleSent.$Shape; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "punchHoleResponse"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse: hbb.PunchHoleResponse.$Shape; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "fetchLocalAddr"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr: hbb.FetchLocalAddr.$Shape; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "localAddr"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr: hbb.LocalAddr.$Shape; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "configureUpdate"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate: hbb.ConfigUpdate.$Shape; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "registerPk"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk: hbb.RegisterPk.$Shape; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "registerPkResponse"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse: hbb.RegisterPkResponse.$Shape; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "softwareUpdate"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate: hbb.SoftwareUpdate.$Shape; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "requestRelay"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay: hbb.RequestRelay.$Shape; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "relayResponse"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse: hbb.RelayResponse.$Shape; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "testNatRequest"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest: hbb.TestNatRequest.$Shape; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "testNatResponse"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse: hbb.TestNatResponse.$Shape; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "peerDiscovery"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery: hbb.PeerDiscovery.$Shape; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "onlineRequest"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest: hbb.OnlineRequest.$Shape; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "onlineResponse"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse: hbb.OnlineResponse.$Shape; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "keyExchange"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange: hbb.KeyExchange.$Shape; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "hc"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc: hbb.HealthCheck.$Shape; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "httpProxyRequest"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest: hbb.HttpProxyRequest.$Shape; httpProxyResponse?: null; iceCandidate?: null }|{ union?: "httpProxyResponse"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse: hbb.HttpProxyResponse.$Shape; iceCandidate?: null }|{ union?: "iceCandidate"; registerPeer?: null; registerPeerResponse?: null; punchHoleRequest?: null; punchHole?: null; punchHoleSent?: null; punchHoleResponse?: null; fetchLocalAddr?: null; localAddr?: null; configureUpdate?: null; registerPk?: null; registerPkResponse?: null; softwareUpdate?: null; requestRelay?: null; relayResponse?: null; testNatRequest?: null; testNatResponse?: null; peerDiscovery?: null; onlineRequest?: null; onlineResponse?: null; keyExchange?: null; hc?: null; httpProxyRequest?: null; httpProxyResponse?: null; iceCandidate: hbb.IceCandidate.$Shape })
        );
    }
}
