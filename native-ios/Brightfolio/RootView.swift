import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ZStack {
            switch appState.selectedTab {
            case .home:
                HomeView()
            case .explore:
                ExploreView()
            case .create:
                CreateView()
            case .library:
                LibraryView()
            case .profile:
                AccountView()
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            NativeBottomBar()
                .padding(.horizontal, 16)
                .padding(.bottom, 8)
        }
        .tint(.brightfolioTeal)
    }
}

struct NativeBottomBar: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        HStack(spacing: 0) {
            NativeBarItem(tab: .home, label: "Home", icon: "house.fill")
            NativeBarItem(tab: .explore, label: "Explore", icon: "safari.fill")

            Button {
                appState.selectedTab = .create
            } label: {
                Image(systemName: "plus")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.brightfolioTeal)
                    .clipShape(Circle())
                    .shadow(color: .brightfolioTeal.opacity(0.3), radius: 12, y: 6)
            }
            .frame(maxWidth: .infinity)
            .offset(y: -12)

            NativeBarItem(tab: .library, label: "Library", icon: "books.vertical.fill")
            NativeBarItem(tab: .profile, label: "Profile", icon: "person.fill")
        }
        .padding(.horizontal, 10)
        .padding(.top, 10)
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .shadow(color: .black.opacity(0.14), radius: 18, y: 8)
    }
}

struct NativeBarItem: View {
    @EnvironmentObject private var appState: AppState
    let tab: AppTab
    let label: String
    let icon: String

    var isSelected: Bool { appState.selectedTab == tab }

    var body: some View {
        Button {
            appState.selectedTab = tab
        } label: {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .semibold))
                Text(label)
                    .font(.caption2.weight(.medium))
            }
            .foregroundStyle(isSelected ? Color.brightfolioTeal : Color.secondary)
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }
}

struct HomeView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(appState.greeting)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)
                        Text("Build a career that feels like you.")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                        Text("Your resume, cover letters, and study tools in one focused workspace.")
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }

                    NativeHeroCard()

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Your toolkit")
                            .font(.title3.weight(.bold))
                        QuickActionCard(title: "Create or edit resume", detail: "Build an ATS-ready resume with guided sections.", icon: "doc.text", tint: .blue) {
                            appState.selectedTab = .create
                        }
                        QuickActionCard(title: "Explore study sets", detail: "Turn notes into practice sessions and flashcards.", icon: "graduationcap", tint: .orange) {
                            appState.selectedTab = .explore
                        }
                        QuickActionCard(title: "Write a cover letter", detail: "Tailor your story to the job you want next.", icon: "envelope", tint: .purple) {
                            appState.selectedTab = .create
                        }
                    }
                }
                .padding(20)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Brightfolio")
        }
    }
}

struct NativeHeroCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Image(systemName: "sparkles")
                .font(.title2.weight(.bold))
                .foregroundStyle(.white)
            Text("Your next opportunity starts with a stronger story.")
                .font(.title2.weight(.bold))
                .foregroundStyle(.white)
            Text("Make progress on the work that gets you noticed.")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.82))
        }
        .padding(22)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(LinearGradient(colors: [.brightfolioTeal, .blue.opacity(0.9)], startPoint: .topLeading, endPoint: .bottomTrailing))
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: .brightfolioTeal.opacity(0.22), radius: 18, y: 8)
    }
}

struct QuickActionCard: View {
    let title: String
    let detail: String
    let icon: String
    let tint: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(tint)
                    .frame(width: 44, height: 44)
                    .background(tint.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.headline).foregroundStyle(.primary)
                    Text(detail).font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(.tertiary)
            }
            .padding(16)
            .background(Color(uiColor: .secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}
