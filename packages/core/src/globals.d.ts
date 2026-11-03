// core는 브라우저(DOM)·Node 타입을 일부러 쓰지 않아요. 어느 플랫폼에 종속되지 않게 하려는 거예요.
// 대신 웹·iOS·안드로이드 모두에 있는 setTimeout만 직접 선언해서 써요.
declare function setTimeout(callback: (...args: unknown[]) => void, ms?: number): unknown;
