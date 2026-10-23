import SwiftUI

enum AppTab: Hashable {
    case home, explore, create, library, profile
}

final class AppState: ObservableObject {
    @Published var selectedTab: AppTab = .home
    @Published var colorScheme: ColorScheme?
    @Published var isSignedIn = false

    var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<18: return "Good afternoon"
        default: return "Good evening"
        }
    }
}
