# JantarMantar Flowchart

Here is a high-level flowchart of the JantarMantar app's navigation and architecture, based on its React Native structure and Redux state.

```mermaid
flowchart TD
    %% Define App States
    Start([App Launch]) --> CheckAuth{Is Authenticated?}
    
    %% Unauthenticated Flow
    CheckAuth -- No --> Splash[Splash Screen]
    Splash --> Login[Login Screen]
    Login -->|Authenticate| CheckAuth

    %% Authenticated Flow
    CheckAuth -- Yes --> MainTabs[Main Tab Navigator]
    
    %% Main Tabs
    subgraph Main App Tabs
        MainTabs --> Home[Home Screen]
        MainTabs --> Chats[Chats Screen]
        MainTabs --> Nearby[Nearby Screen]
        MainTabs --> Downloads[Downloads Screen]
        MainTabs --> Settings[Settings Screen]
    end

    %% Sub-Screens / Stack Screens
    Chats --> ChatDetail[Chat Screen]
    Chats --> GroupChat[Group Chat Screen]
    Nearby --> NetworkMap[Network Map Screen]
    Downloads --> FileTransfer[File Transfer Screen]
    Home --> Profile[Profile Screen]
    Home --> SOS[Emergency SOS Screen]
    Settings --> DevTools[Developer Tools Screen]

    %% Redux Store Architecture
    subgraph Redux Store Architecture
        Store[(Redux Store)]
        Store --> AuthState[Auth Slice]
        Store --> ChatState[Chat Slice]
        Store --> GatewayState[Gateway Slice]
        Store --> MeshState[Mesh Slice]
        Store --> TransferState[Transfer Slice]
    end
    
    %% Connections between UI and State
    Login -.-> AuthState
    Chats -.-> ChatState
    ChatDetail -.-> ChatState
    NetworkMap -.-> MeshState
    NetworkMap -.-> GatewayState
    FileTransfer -.-> TransferState
```

### Architecture Highlights
- **Navigation:** The app utilizes `@react-navigation/native` with a root stack navigator distinguishing between unauthenticated (`Splash`, `Login`) and authenticated states.
- **Main Tabs:** Contains five core bottom tabs: `Home`, `Chats`, `Nearby`, `Downloads`, and `Settings`.
- **State Management:** Uses Redux (identified via `react-redux` and slices). State slices include `auth`, `chat`, `gateway`, `mesh`, and `transfer` to manage specific features.
- **Mesh/P2P Focus:** As observed from the `MeshOrchestrator` and specific screens (`NetworkMapScreen`, `NearbyScreen`), the app appears to facilitate decentralized or mesh network communications.
