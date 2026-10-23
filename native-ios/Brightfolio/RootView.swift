import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(AppTab.home)
            ResumeView()
                .tabItem { Label("Resume", systemImage: "doc.text.fill") }
                .tag(AppTab.resume)
            LettersView()
                .tabItem { Label("Letters", systemImage: "envelope.fill") }
                .tag(AppTab.letters)
            StudyView()
                .tabItem { Label("Study", systemImage: "graduationcap.fill") }
                .tag(AppTab.study)
            AccountView()
                .tabItem { Label("Account", systemImage: "person.crop.circle.fill") }
                .tag(AppTab.account)
        }
        .tint(.brightfolioTeal)
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
                        QuickActionCard(title: "Resume Builder", detail: "Create an ATS-ready resume with guided sections.", icon: "doc.text", tint: .blue) {
                            appState.selectedTab = .resume
                        }
                        QuickActionCard(title: "Cover Letters", detail: "Tailor your story to the job you want next.", icon: "envelope", tint: .purple) {
                            appState.selectedTab = .letters
                        }
                        QuickActionCard(title: "Study Sets", detail: "Turn notes into practice sessions and flashcards.", icon: "graduationcap", tint: .orange) {
                            appState.selectedTab = .study
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
