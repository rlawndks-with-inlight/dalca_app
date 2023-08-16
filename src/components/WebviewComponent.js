import { useEffect, useRef, useState } from 'react';
//import { WebView } from 'react-native-webview';
import { BackHandler, Platform, ToastAndroid } from 'react-native';
import { login, logout, getProfile as getKakaoProfile, unlink } from '@react-native-seoul/kakao-login';
import { SHARED_PREFERENCE, deleteSharedPreference, getSharedPreference, setSharedPreference } from '../shared-preference';
import { WebView } from 'react-native-webview';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
// import SmsRetriever from 'react-native-sms-retriever';
import GetLocation from 'react-native-get-location';

const WEBVIEW_URL = `https://dalcapay.com`;
const ON_END_URL_LIST = [
    `${WEBVIEW_URL}/app/`,
    `${WEBVIEW_URL}/app/login/`,
    `${WEBVIEW_URL}/app/home/`,
]
async function onAppleButtonPress() {
    // start a login request
    try {
        const appleAuthRequestResponse = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            requestedScopes: [appleAuth.Scope.FULL_NAME],
        });
        return appleAuthRequestResponse
    } catch (error) {
        return {};
    }
}
const WebviewComponent = (props) => {
    const {
        func: {
            setVisible,
            setBackgroundColor
        }
    } = props;


    // SMS 수신 이벤트 등록
    const webViewRef = useRef(null);

    const [canGoBack, setCanGoBack] = useState(false);
    const [backButtonCount, setBackButtonCount] = useState(0);
    const [currentURL, setCurrentURL] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);

    // useEffect(() => {
    //     // SMS 수신 이벤트 리스너 등록
    //     const startSmsRetriever = async () => {
    //         try {
    //             const registered = await SmsRetriever.startSmsRetriever();
    //             if (registered) {
    //                 SmsRetriever.addSmsListener((event) => {
    //                     const { message } = event;
    //                     ToastAndroid.BOTTOM('SMS 수신:', event)
    //                     // SMS 메시지에서 인증번호 추출
    //                     //const regex = /([0-9]{6})/; // 인증번호는 6자리 숫자로 가정
    //                     // const extractedCode = message.match(regex);
    //                     // if (extractedCode) {
    //                     //     setVerificationCode(extractedCode[0]); // 추출한 인증번호 저장
    //                     // }
    //                 });
    //             }
    //         } catch (error) {
    //             console.log('SMS 수신 에러:', error);
    //         }
    //     };

    //     startSmsRetriever();

    //     return () => {
    //         // SMS 수신 이벤트 리스너 등록 해제
    //         SmsRetriever.removeSmsListener();
    //     };
    // }, []);

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress);
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', onAndroidBackPress);
        };
    }, [backButtonCount, canGoBack, currentURL]);
    const onAndroidBackPress = () => {
        if (canGoBack) {
            webViewRef.current.goBack();
            return true;
        } else {
            return false; // app will be closed
        }
    };
    const onMessage = async (e) => {
        const event = JSON.parse(e.nativeEvent.data)
        let method = event?.method;
        let data = event?.data;
        if (method == 'logined') {
            let id = await getSharedPreference(SHARED_PREFERENCE.ID);
            let login_type = await getSharedPreference(SHARED_PREFERENCE.LOGIN_TYPE);
            let os = Platform.OS;
            webViewRef.current.postMessage(
                JSON.stringify({ method: method, data: { id: id, login_type: login_type, os: os.toString() } }),
                '*'
            )
        } else if (method == 'login') {
            let id = data?.id;
            let login_type = data?.login_type;
            setSharedPreference(SHARED_PREFERENCE.ID, id ?? "")
            setSharedPreference(SHARED_PREFERENCE.LOGIN_TYPE, login_type ?? "")
        } else if (method == 'logout') {
            let result1 = await deleteSharedPreference(SHARED_PREFERENCE.ID);
            let result2 = await deleteSharedPreference(SHARED_PREFERENCE.LOGIN_TYPE);
        } else if (method == 'get_location') {
            let location = await GetLocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 60000,
            });
            webViewRef.current.postMessage(
                JSON.stringify({ method: method, data: location }),
                '*'
            )
        }
    }
    const handleWebViewNavigationStateChange = (navState) => {
        setCurrentURL(navState.url);
        setCanGoBack(navState.canGoBack);
    };
    const handleWebViewError = (error) => {
        console.error(error); // WebView에서 에러 발생 시 에러 로그 출력
    };
    useEffect(() => {
        console.log(webViewRef.current)
    }, [webViewRef.current])
    return (
        <WebView
            ref={webViewRef}
            source={{ uri: `${WEBVIEW_URL}` }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            onMessage={onMessage}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            onLoad={() => {
                setVisible(false);
            }}
            onError={handleWebViewError}
            androidHardwareAccelerationEnabled={true}
            cacheEnabled={true}
            decelerationRate="normal"
            sharedCookiesEnabled={true}
            renderingMode="hybrid"
            useWebkit={true}
        />
    )
}
export default WebviewComponent

