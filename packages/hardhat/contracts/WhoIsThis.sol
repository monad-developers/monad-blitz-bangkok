// SPDX-License-Identifier: ISC
pragma solidity >=0.8.0 <0.9.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function mint(address receiver, uint256 amount) external;
}

contract WhoIsThis {
    struct Report {
        uint256 id;
        string title;
        uint256 good;
        uint256 bad;
        address[] voters;
        uint256 voterCount;
        address reporter;
        bool reporterClaimed;
        mapping(address => bool) voterClaimed;
    }

    uint256 reportCount = 0;
    Report[] reports;

    IERC20 public immutable WITH_TOKEN;
    uint256 public constant REPORTER_REWARD = 5 * 10**18; // 5 WITH
    uint256 public constant VOTER_REWARD = 1 * 10**18; // 1 WITH
    uint256 public constant MIN_VOTERS_FOR_REWARD = 2;

    constructor(address _withToken) {
        WITH_TOKEN = IERC20(_withToken);
    }

    function report(string memory _title) external {
        Report storage newReport = reports.push();
        newReport.id = reportCount;
        newReport.title = _title;
        newReport.good = 0;
        newReport.bad = 0;
        newReport.voterCount = 0;
        newReport.reporter = msg.sender;
        newReport.reporterClaimed = false;

        reportCount++;
    }

    function vote(uint256 _reportId, bool _isGood) external {
        require(_reportId < reports.length, "Invalid report ID");
        Report storage reportItem = reports[_reportId];

        // Check if user has already voted
        for (uint256 i = 0; i < reportItem.voters.length; i++) {
            require(reportItem.voters[i] != msg.sender, "Already voted");
        }

        // Add vote
        if (_isGood) {
            reportItem.good++;
        } else {
            reportItem.bad++;
        }

        // Record voter
        reportItem.voters.push(msg.sender);
        reportItem.voterCount++;
    }

    function claimReporterReward(uint256 _reportId) external {
        require(_reportId < reports.length, "Invalid report ID");
        Report storage reportItem = reports[_reportId];

        require(msg.sender == reportItem.reporter, "Not the reporter");
        require(reportItem.voterCount >= MIN_VOTERS_FOR_REWARD, "Not enough voters");
        require(!reportItem.reporterClaimed, "Already claimed");

        reportItem.reporterClaimed = true;
        WITH_TOKEN.mint(msg.sender, REPORTER_REWARD);
    }

    function claimVoterReward(uint256 _reportId) external {
        require(_reportId < reports.length, "Invalid report ID");
        Report storage reportItem = reports[_reportId];

        // Check if sender is a voter
        bool isVoter = false;
        for (uint256 i = 0; i < reportItem.voters.length; i++) {
            if (reportItem.voters[i] == msg.sender) {
                isVoter = true;
                break;
            }
        }
        require(isVoter, "Not a voter for this report");
        require(reportItem.voterCount >= MIN_VOTERS_FOR_REWARD, "Not enough voters");
        require(!reportItem.voterClaimed[msg.sender], "Already claimed");

        reportItem.voterClaimed[msg.sender] = true;
        WITH_TOKEN.mint(msg.sender, VOTER_REWARD);
    }

    function getReportCount() external view returns (uint256) {
        return reports.length;
    }

    function getReport(uint256 _reportId) external view returns (
        uint256 id,
        string memory title,
        uint256 good,
        uint256 bad,
        address[] memory voters,
        uint256 voterCount,
        address reporter,
        bool reporterClaimed
    ) {
        require(_reportId < reports.length, "Invalid report ID");
        Report storage reportItem = reports[_reportId];

        return (
            reportItem.id,
            reportItem.title,
            reportItem.good,
            reportItem.bad,
            reportItem.voters,
            reportItem.voterCount,
            reportItem.reporter,
            reportItem.reporterClaimed
        );
    }

    function hasVoterClaimed(uint256 _reportId, address _voter) external view returns (bool) {
        require(_reportId < reports.length, "Invalid report ID");
        return reports[_reportId].voterClaimed[_voter];
    }
}